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
      try {
        parsedCV = await parseCVWithAI(cvText, validatedData.additionalInfo)
        console.log("✅ CV erfolgreich geparst")
      } catch (parseError: any) {
        console.error("❌ OpenAI Parsing-Fehler:", parseError)
        
        // Bei OpenAI-Fehler: Informiere User aber fahre mit Basisprofil fort
        const errorMessage = getUserFriendlyErrorMessage(parseError)
        console.warn(`⚠️ Fallback: ${errorMessage}`)
      }
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
 */
function createFallbackProfile(formData: {
  name: string
  location: string
  position: string
  contactEmail: string
}): ParsedCV {
  return {
    personalInfo: {
      name: formData.name,
      location: formData.location,
      email: formData.contactEmail,
      phone: undefined,
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
    },
    certifications: [],
    projects: [],
    summary: `${formData.position} mit Interesse an professioneller Weiterentwicklung. Profil erstellt aus Basisdaten.`,
    experienceYears: "< 1 Jahr",
  }
}
