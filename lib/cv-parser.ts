import { openAIClient } from './openai-client'
import { type ParsedCV } from './schemas'

/**
 * Hauptfunktion für CV-Parsing mit OpenAI
 * Verwendet den konsolidierten OpenAI-Client mit Retry-Logic
 */
export async function parseCVWithAI(cvText: string, additionalInfo?: string): Promise<ParsedCV> {
  return await openAIClient.parseCV(cvText, additionalInfo)
}

// Re-export Type für Backward Compatibility
export type { ParsedCV } from './schemas'

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
