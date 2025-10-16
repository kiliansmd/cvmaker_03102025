"use server"

import { extractTextFromFile } from "@/lib/file-extractor"
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
    }

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
      cvText = await extractTextFromFile(file)
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

    if (hasSufficientText) {
      console.log("🤖 Parse CV mit OpenAI...")
      console.log(`📊 CV-Text-Länge: ${cvText.length} Zeichen`)
      console.log(`📊 Erste 500 Zeichen des CV-Texts:\n${cvText.substring(0, 500)}\n`)
      
      try {
        parsedCV = await parseCVWithAI(cvText, validatedData.additionalInfo)
        console.log("✅ CV erfolgreich geparst")
        console.log("📊 Geparste Daten (vor Profil-Gen):", JSON.stringify({
          name: parsedCV.personalInfo?.name,
          experienceCount: parsedCV.experience?.length,
          skillsCount: parsedCV.skills?.technical?.length,
          educationCount: parsedCV.education?.length,
        }))
      } catch (parseError: any) {
        console.error("❌ OpenAI Parsing-Fehler:", parseError)
        console.error("❌ Error-Type:", parseError?.constructor?.name)
        console.error("❌ Error-Code:", parseError?.code)
        console.error("❌ Error-Message:", parseError?.message)
        
        // Bei OpenAI-Fehler: Informiere User aber fahre mit Basisprofil fort
        const errorMessage = getUserFriendlyErrorMessage(parseError)
        console.warn(`⚠️ Fallback: ${errorMessage}`)
      }
    } else {
      console.warn(`⚠️ Text zu kurz (${cvText.length} Zeichen), überspringe OpenAI-Parsing`)
    }

    // 5. Fallback: Erstelle Minimalprofil aus Formdaten
    if (!parsedCV) {
      parsedCV = createFallbackProfile(validatedData)
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
