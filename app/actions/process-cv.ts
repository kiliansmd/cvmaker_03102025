"use server"

import { extractTextFromFile } from "@/lib/file-extractor"
import { parseCVWithAI } from "@/lib/cv-parser"
import type { ParsedCV } from "@/lib/cv-parser"
import { generateProfileFromParsedCV } from "@/lib/profile-generator"

export async function processCVAction(formData: FormData) {
  try {
    // 1. Extrahiere Datei und Form-Daten
    const file = formData.get("cvFile") as File
    const name = formData.get("name") as string
    const position = formData.get("position") as string
    const location = formData.get("location") as string
    const salary = formData.get("salary") as string
    const availability = formData.get("availability") as string
    const contactPerson = formData.get("contactPerson") as string
    const contactPhone = formData.get("contactPhone") as string
    const contactEmail = formData.get("contactEmail") as string
    const additionalInfo = formData.get("additionalInfo") as string

    if (!file || !name || !position || !location) {
      return {
        success: false,
        error: "Erforderliche Felder fehlen: Name, Position und Standort sind Pflichtfelder.",
      }
    }

    console.log("📄 Starte CV-Verarbeitung für:", name)
    console.log("📎 Datei:", file.name, "Typ:", file.type, "Größe:", file.size)

    // 2. Extrahiere Text aus der Datei
    console.log("🔍 Extrahiere Text aus Datei...")
    let cvText: string = ""

    try {
      cvText = await extractTextFromFile(file)
      console.log("✅ Text extrahiert. Länge:", cvText.length, "Zeichen")
    } catch (extractError: any) {
      console.error("❌ Fehler bei Text-Extraktion:", extractError)
      // Kein Hard-Error mehr: Wir fahren mit Minimalprofil-Fallback fort
      cvText = ""
    }

    const hasSomeText = !!cvText && cvText.trim().length >= 10

    // 3. Parse CV mit OpenAI
    console.log("🤖 Parse CV mit OpenAI GPT-4...")
    let parsedCV: ParsedCV | null = null

    try {
      if (hasSomeText) {
        parsedCV = await parseCVWithAI(cvText, additionalInfo)
        console.log("✅ CV erfolgreich geparst")
      }
    } catch (parseError: any) {
      console.error("❌ OpenAI Parsing-Fehler:", parseError)
      const message = String(parseError?.message || parseError)
      const hint = message.includes("OPENAI_API_KEY")
        ? " Bitte setzen Sie OPENAI_API_KEY (.env.local/Railway)."
        : ""
      // Fallback: Minimalprofil generieren
      console.warn("⚠️ Fallback: Generiere Minimalprofil ohne AI-Parsing.")
    }

    // Wenn Parsing nicht möglich war oder Text zu kurz: Minimalprofil auf Basis der Formdaten erzeugen
    if (!parsedCV) {
      parsedCV = {
        personalInfo: {
          name,
          location,
          email: undefined,
          phone: undefined,
        } as any,
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          languages: [],
        },
        certifications: [],
        projects: [],
        summary: "Zusammenfassung konnte nicht automatisch extrahiert werden.",
        experienceYears: "< 1 Jahr",
      }
    }

    // Normalisierung: Stelle Pflichtstrukturen sicher
    parsedCV.personalInfo = parsedCV.personalInfo || ({} as any)
    if (!parsedCV.personalInfo.location) parsedCV.personalInfo.location = location
    if (!parsedCV.personalInfo.name) parsedCV.personalInfo.name = name
    parsedCV.experience = parsedCV.experience || []
    parsedCV.education = parsedCV.education || []
    parsedCV.certifications = parsedCV.certifications || []
    parsedCV.skills = parsedCV.skills || ({ technical: [], soft: [], languages: [] } as any)

    // 4. Generiere Profil-Daten
    console.log("📋 Generiere Profil-Daten...")
    const profileData = generateProfileFromParsedCV(parsedCV, {
      position,
      salary,
      availability,
      contactPerson,
      contactPhone,
      contactEmail,
    })

    console.log("✅ Profil erfolgreich generiert!")

    return {
      success: true,
      data: profileData,
    }
  } catch (error: any) {
    console.error("❌ Unerwarteter Fehler beim CV-Processing:", error)
    return {
      success: false,
      error: error.message || "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    }
  }
}
