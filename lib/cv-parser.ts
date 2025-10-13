import { parseWithSimpleJSON, type SimpleParsedCV } from "./openai-parser-simple"

// Typdefinitionen für das strukturierte CV-Parsing
export interface ParsedCV {
  personalInfo: {
    name: string
    dateOfBirth?: string
    nationality?: string
    location: string
    email?: string
    phone?: string
  }
  experience: Array<{
    title: string
    company: string
    dateRange: string
    description: string
    responsibilities: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    dateRange: string
    details?: string
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: Array<{
      language: string
      level: string
    }>
  }
  certifications: string[]
  projects?: Array<{
    title: string
    description: string
    technologies?: string[]
  }>
  summary: string
  experienceYears: string
}

// Mapper: SimpleParsedCV → ParsedCV (kompatibel mit bestehendem System)
function mapToLegacyFormat(simple: SimpleParsedCV): ParsedCV {
  return {
    personalInfo: {
      name: simple.name,
      location: simple.location,
      email: simple.email,
      phone: simple.phone,
    },
    experience: simple.experience,
    education: simple.education.map((e) => ({ ...e, details: undefined })),
    skills: simple.skills,
    certifications: simple.certifications,
    projects: [],
    summary: simple.summary,
    experienceYears: simple.experienceYears,
  }
}

export async function parseCVWithAI(cvText: string, additionalInfo?: string): Promise<ParsedCV> {
  try {
    const simple = await parseWithSimpleJSON(cvText, additionalInfo)
    return mapToLegacyFormat(simple)
  } catch (error: any) {
    console.error("CV-Parsing fehlgeschlagen:", error)
    throw new Error(`CV-Parsing fehlgeschlagen: ${error?.message || String(error)}`)
  }
}

// Hilfsfunktion zur Berechnung der Berufserfahrung
export function calculateExperienceYears(experience: ParsedCV["experience"]): string {
  // Einfache Berechnung basierend auf den Datumsbereichen
  const currentYear = new Date().getFullYear()
  let totalMonths = 0

  for (const exp of experience) {
    const dateRange = exp.dateRange.toLowerCase()
    const years = dateRange.match(/(\d{4})/g)

    if (years && years.length >= 1) {
      const startYear = Number.parseInt(years[0], 10)
      const endYear =
        dateRange.includes("heute") || dateRange.includes("present")
          ? currentYear
          : Number.parseInt(years[1] || years[0], 10)

      totalMonths += (endYear - startYear) * 12
    }
  }

  const totalYears = Math.floor(totalMonths / 12)
  return totalYears > 0 ? `${totalYears}+ Jahre` : "< 1 Jahr"
}
