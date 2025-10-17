"use server"

import { extractTextFromFile, sanitizeExtractedText } from "@/lib/file-extractor"
import { parseCVWithAI } from "@/lib/cv-parser"
import { generateProfileFromParsedCV } from "@/lib/profile-generator"
import { validateFileOrThrow } from "@/lib/file-validator"
import { CVUploadFormSchema, type ParsedCV, type CandidateProfile } from "@/lib/schemas"
import { AppError, ErrorCode, getUserFriendlyErrorMessage } from "@/lib/errors"

export interface ProcessCVResult {
  success: boolean
  data?: CandidateProfile
  error?: string
  code?: string
}

export async function processCVAction(formData: FormData): Promise<ProcessCVResult> {
  try {
    // 1. Extrahiere und validiere Form-Daten
    const file = formData.get("cvFile") as File | null
    const rawFormData = {
      name: formData.get("name") as string,
      position: formData.get("position") as string,
      location: formData.get("location") as string,
      salary: formData.get("salary") as string,
      availability: formData.get("availability") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactEmail: formData.get("contactEmail") as string,
      additionalInfo: formData.get("additionalInfo") as string,
      requestId: formData.get("requestId") as string, // Cache-Busting ID
    }

    // Cache-Busting Logging
    const requestId = rawFormData.requestId || `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log("🆔 Server Action Request-ID (Cache-Busting):", requestId)

    // Validiere mit Zod (wirft bei Fehler)
    const validatedData = CVUploadFormSchema.parse({
      ...rawFormData,
      cvFile: file || undefined,
    })

    if (!file) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Bitte laden Sie eine CV-Datei hoch.",
        400
      )
    }

    console.log("📄 Starte CV-Verarbeitung für:", validatedData.name)
    console.log("📎 Datei:", file.name, "Typ:", file.type, "Größe:", file.size)

    // 2. Server-side File-Validierung (Magic Bytes, Größe, etc.)
    console.log("🔒 Validiere Datei...")
    await validateFileOrThrow(file)
    console.log("✅ Datei-Validierung erfolgreich")

    // 3. Extrahiere Text aus der Datei
    console.log("🔍 Extrahiere Text aus Datei...")
    console.log("📎 Dateidetails:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })
    
    let cvText = ""

    try {
      const rawText = await extractTextFromFile(file)
      cvText = sanitizeExtractedText(rawText, { maxChars: 160_000 })
      console.log("✅ Text extrahiert. Länge:", cvText.length, "Zeichen")
      console.log("📄 Erste 300 Zeichen des extrahierten Texts:", cvText.substring(0, 300))
      
      if (cvText.length < 100) {
        console.warn("⚠️ WARNUNG: Sehr wenig Text extrahiert - möglicherweise Problem mit Datei oder Encoding")
      }
    } catch (extractError: any) {
      console.error("❌ Fehler bei Text-Extraktion:", extractError)
      console.error("❌ Error-Details:", {
        message: extractError?.message,
        stack: extractError?.stack?.substring(0, 200),
      })
      
      // Wenn Extraktion fehlschlägt: Versuche Minimalprofil
      if (cvText.trim().length < 50) {
        console.warn("⚠️ Text zu kurz oder Extraktion fehlgeschlagen - erstelle Basisprofil")
      }
    }

    // 4. Parse CV mit OpenAI (mit Retry-Logic)
    let parsedCV: ParsedCV | null = null
    const hasSufficientText = cvText.trim().length >= 50

    console.log(`🔍 Text-Check: ${cvText.length} Zeichen extrahiert, hasSufficientText=${hasSufficientText}`)

    if (!hasSufficientText) {
      console.error(`❌ KRITISCH: Text zu kurz (${cvText.length} Zeichen)! Minimum: 50 Zeichen`)
      console.error(`❌ Text-Content (komplett): "${cvText}"`)
      
      // Werfe Fehler statt Fallback bei zu wenig Text
      throw new AppError(
        ErrorCode.FILE_EXTRACTION_FAILED,
        `Die Datei konnte nicht korrekt gelesen werden. Es wurden nur ${cvText.length} Zeichen extrahiert. Bitte versuchen Sie es mit einer DOCX-Datei oder einer anderen Datei.`,
        400,
        { extractedLength: cvText.length, fileName: file.name }
      )
    }

    console.log("🤖 Starte OpenAI CV-Parsing...")
    console.log(`📊 CV-Text-Länge (bereinigt): ${cvText.length} Zeichen`)
    console.log(`📊 Erste 500 Zeichen des CV-Texts:\n${cvText.substring(0, 500)}\n`)
    
    try {
      parsedCV = await parseCVWithAI(cvText, validatedData.additionalInfo)
      
      if (!parsedCV) {
        throw new Error('parseCVWithAI returned null')
      }
      
      console.log("✅ CV erfolgreich geparst")
      console.log("📊 Geparste Daten (DetailCheck):", JSON.stringify({
        name: parsedCV.personalInfo?.name,
        location: parsedCV.personalInfo?.location,
        experienceCount: parsedCV.experience?.length,
        experienceFirstTitle: parsedCV.experience?.[0]?.title,
        experienceFirstCompany: parsedCV.experience?.[0]?.company,
        skillsCount: parsedCV.skills?.technical?.length,
        skillsFirst3: parsedCV.skills?.technical?.slice(0, 3),
        educationCount: parsedCV.education?.length,
        educationFirst: parsedCV.education?.[0]?.degree,
        summary: parsedCV.summary?.substring(0, 100),
      }, null, 2))
      
      // Validiere dass wir echte Daten haben
      const hasRealData = 
        (parsedCV.experience?.length || 0) > 0 ||
        (parsedCV.skills?.technical?.length || 0) > 0 ||
        (parsedCV.education?.length || 0) > 0
      
      if (!hasRealData) {
        console.error('❌ WARNUNG: OpenAI hat keine verwertbaren Daten zurückgegeben!')
        console.error('❌ ParsedCV:', JSON.stringify(parsedCV, null, 2))
        console.warn('⚠️ Verwende Fallback-Profil basierend auf Formulardaten')
        
        // Erstelle Minimal-ParsedCV aus Formulardaten
        parsedCV = createFallbackProfile({
          name: validatedData.name,
          location: validatedData.location,
          position: validatedData.position,
          contactEmail: validatedData.contactEmail,
        })
      }
      
    } catch (parseError: any) {
      console.error("❌ ===== OpenAI PARSING FEHLER =====")
      console.error("❌ Error-Type:", parseError?.constructor?.name)
      console.error("❌ Error-Code:", parseError?.code)
      console.error("❌ Error-Message:", parseError?.message)
      console.error("❌ Error-Stack:", parseError?.stack?.substring(0, 500))
      console.error("❌ ===== END ERROR =====")
      
      // Bei kritischen Fehlern (API-Key, Quota) → Abbruch
      const isCriticalError = 
        parseError?.code === ErrorCode.CONFIGURATION_ERROR ||
        parseError?.code === ErrorCode.OPENAI_NO_CREDITS
      
      if (isCriticalError) {
        throw new AppError(
          parseError.code,
          parseError.message,
          parseError.statusCode || 500,
          { originalError: parseError }
        )
      }
      
      // Bei anderen Fehlern → Fallback-Profil
      console.warn('⚠️ OpenAI-Parsing fehlgeschlagen, erstelle Fallback-Profil')
      parsedCV = createFallbackProfile({
        name: validatedData.name,
        location: validatedData.location,
        position: validatedData.position,
        contactEmail: validatedData.contactEmail,
      })
    }

    if (!parsedCV) {
      // Sollte nie passieren, aber Sicherheitscheck
      throw new AppError(
        ErrorCode.CV_PARSING_FAILED,
        'CV-Parsing lieferte keine Daten. Bitte versuchen Sie es erneut.',
        500
      )
    }

    // 6. Generiere finales Kandidaten-Profil
    console.log("📋 Generiere Profil-Daten...")
    console.log("📊 ParsedCV-Daten vor Profile-Generierung:", {
      hasExperience: (parsedCV.experience || []).length > 0,
      hasSkills: (parsedCV.skills?.technical || []).length > 0,
      hasEducation: (parsedCV.education || []).length > 0,
      experienceYears: parsedCV.experienceYears,
      name: parsedCV.personalInfo?.name,
    })
    
    const profileData = generateProfileFromParsedCV(parsedCV, {
      position: validatedData.position,
      salary: validatedData.salary,
      availability: validatedData.availability,
      contactPerson: validatedData.contactPerson,
      contactPhone: validatedData.contactPhone,
      contactEmail: validatedData.contactEmail,
      location: validatedData.location,
    })

    console.log("✅ Profil erfolgreich generiert!")
    console.log("📊 Generiertes Profil:", {
      title: profileData.title,
      itSkillsCount: profileData.itSkills?.length || 0,
      languagesCount: profileData.languages?.length || 0,
      educationCount: profileData.education?.length || 0,
      experienceTimelineCount: profileData.experienceTimeline?.length || 0,
    })

    return {
      success: true,
      data: profileData,
    }
  } catch (error: any) {
    console.error("❌ Fehler beim CV-Processing:", error)

    // Structured Error Response
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    // Unbekannter Fehler
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      code: ErrorCode.UNKNOWN_ERROR,
    }
  }
}

/**
 * Erstellt ein Fallback-Profil wenn CV-Parsing fehlschlägt
 * Nutzt Formular-Daten für minimale aber sinnvolle Ausgabe
 */
function createFallbackProfile(formData: {
  name: string
  location: string
  position: string
  contactEmail: string
}): ParsedCV {
  console.log('⚠️ Erstelle Fallback-Profil aus Formdaten:', formData)
  
  // Extrahiere mögliche Skills aus der Position
  const positionLower = formData.position.toLowerCase()
  const detectedSkills: string[] = []
  
  // Skill-Detection aus Position
  if (positionLower.includes('sap')) detectedSkills.push('SAP')
  if (positionLower.includes('java')) detectedSkills.push('Java')
  if (positionLower.includes('python')) detectedSkills.push('Python')
  if (positionLower.includes('react')) detectedSkills.push('React')
  if (positionLower.includes('developer') || positionLower.includes('entwickler')) {
    detectedSkills.push('Software-Entwicklung', 'Agile Methoden')
  }
  if (positionLower.includes('consultant') || positionLower.includes('berater')) {
    detectedSkills.push('Beratung', 'Projektmanagement')
  }
  
  return {
    personalInfo: {
      name: formData.name,
      location: formData.location,
      email: formData.contactEmail,
      phone: undefined,
    },
    experience: [
      {
        title: formData.position,
        company: 'Aktueller Arbeitgeber',
        dateRange: 'Aktuell',
        description: `Tätigkeit als ${formData.position}`,
        responsibilities: [
          'Detaillierte Informationen aus CV nicht verfügbar',
          'Bitte CV erneut hochladen für vollständige Analyse'
        ],
      }
    ],
    education: [
      {
        degree: 'Akademischer Abschluss',
        institution: 'Details aus CV nicht verfügbar',
        dateRange: '',
      }
    ],
    skills: {
      technical: detectedSkills.length > 0 ? detectedSkills : ['Fachkenntnisse im Bereich ' + formData.position],
      soft: ['Teamfähigkeit', 'Kommunikationsstärke', 'Analytisches Denken'],
      languages: [
        { language: 'Deutsch', level: 'Muttersprache' },
        { language: 'Englisch', level: 'Gute Kenntnisse' }
      ],
    },
    certifications: [],
    projects: [],
    summary: `Erfahrene/r ${formData.position} mit fundiertem Fachwissen und praktischer Erfahrung. Profil wurde aus Basis-Informationen erstellt - für vollständige Analyse bitte CV erneut hochladen.`,
    experienceYears: "Berufserfahrung vorhanden",
  }
}
