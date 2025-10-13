import { OpenAI } from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

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

const CV_PARSING_SCHEMA = {
  type: "object" as const,
  properties: {
    personalInfo: {
      type: "object" as const,
      properties: {
        name: { type: "string" as const },
        dateOfBirth: { type: "string" as const },
        nationality: { type: "string" as const },
        location: { type: "string" as const },
        email: { type: "string" as const },
        phone: { type: "string" as const },
      },
      required: ["name", "location"],
    },
    experience: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          company: { type: "string" as const },
          dateRange: { type: "string" as const },
          description: { type: "string" as const },
          responsibilities: {
            type: "array" as const,
            items: { type: "string" as const },
          },
        },
        required: ["title", "company", "dateRange", "description"],
      },
    },
    education: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          degree: { type: "string" as const },
          institution: { type: "string" as const },
          dateRange: { type: "string" as const },
          details: { type: "string" as const },
        },
        required: ["degree", "institution", "dateRange"],
      },
    },
    skills: {
      type: "object" as const,
      properties: {
        technical: {
          type: "array" as const,
          items: { type: "string" as const },
        },
        soft: {
          type: "array" as const,
          items: { type: "string" as const },
        },
        languages: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              language: { type: "string" as const },
              level: { type: "string" as const },
            },
            required: ["language", "level"],
          },
        },
      },
      required: ["technical", "languages"],
    },
    certifications: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    projects: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: { type: "string" as const },
          technologies: {
            type: "array" as const,
            items: { type: "string" as const },
          },
        },
        required: ["title", "description"],
      },
    },
    summary: { type: "string" as const },
    experienceYears: { type: "string" as const },
  },
  required: ["personalInfo", "experience", "education", "skills", "summary", "experienceYears"],
}

export async function parseCVWithAI(cvText: string, additionalInfo?: string): Promise<ParsedCV> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your-key-here")) {
    throw new Error(
      "OPENAI_API_KEY fehlt oder ist ein Platzhalter. Bitte setzen Sie einen gültigen Key in .env.local bzw. Railway Variables.",
    )
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const primaryModel = process.env.OPENAI_MODEL || "gpt-4o-2024-08-06"
  const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini"

  const tryParseJson = (text: string) => {
    try {
      return JSON.parse(text)
    } catch (_) {
      // Extrahiere JSON aus einem Codeblock oder gemischtem Text
      const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/)
      if (match && match[1]) {
        return JSON.parse(match[1])
      }
      return null
    }
  }
  const systemPrompt = `Du bist ein Experte für das Parsen und Analysieren von Lebensläufen und CVs.
Deine Aufgabe ist es, den gegebenen Lebenslauf gründlich zu analysieren und alle relevanten Informationen in einem strukturierten JSON-Format zu extrahieren.

WICHTIGE REGELN:
1. Extrahiere ALLE Informationen aus dem CV präzise und vollständig
2. Behalte Original-Firmennamen, Titel und Technologien bei (anonymisiere NICHT)
3. Formatiere Datumsbereiche einheitlich (z.B. "Januar 2020 - März 2023" oder "2020 - Heute")
4. Berechne die Gesamtberufserfahrung in Jahren
5. Erstelle eine prägnante, professionelle Zusammenfassung (2-3 Sätze)
6. Kategorisiere Skills in technical (Programmiersprachen, Tools, etc.) und soft skills
7. Extrahiere ALLE Zertifikate, Ausbildungen und Projekte
8. Wenn Informationen fehlen, lass das Feld leer oder verwende leere Arrays

Achte besonders auf:
- Berufserfahrung mit genauen Zeiträumen und Verantwortlichkeiten
- Technische Fähigkeiten und verwendete Technologien
- Ausbildung und akademische Grade
- Sprachkenntnisse mit Niveau-Angaben
- Zertifizierungen und Weiterbildungen
- Besondere Projekte oder Erfolge`

  const userPrompt = `Analysiere den folgenden Lebenslauf und extrahiere alle Informationen:

${cvText}

${additionalInfo ? `\n\nZusätzliche Informationen vom Recruiter:\n${additionalInfo}` : ""}

Extrahiere nun ALLE Informationen aus diesem CV in das strukturierte JSON-Format.`

  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

  const completion = await openai.chat.completions.create({
      model: primaryModel,
      messages,
      // Einige Accounts verlangen explicit additionalProperties:false
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cv_parsing",
          strict: true,
          schema: { ...CV_PARSING_SCHEMA, additionalProperties: false },
        },
      },
      temperature: 0.1,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("Keine Antwort von OpenAI erhalten")
    }

    const parsedData = tryParseJson(content) as ParsedCV | null
    if (!parsedData) {
      throw new Error("Antwort konnte nicht als JSON geparst werden")
    }
    return parsedData
  } catch (error) {
    console.error("Fehler beim CV-Parsing mit OpenAI:", error)
    // Fallback auf leichteres Modell ohne Strict JSON Schema
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt + "\nLiefere reines JSON ohne Kommentare." },
        { role: "user", content: `Extrahiere strukturierte Daten als JSON aus:\n\n${cvText}` },
      ]
      const completion = await openai.chat.completions.create({
        model: fallbackModel,
        messages,
        temperature: 0.1,
        max_tokens: 4000,
      })
      const content = completion.choices[0]?.message?.content || ""
      const parsed = tryParseJson(content)
      if (!parsed) {
        throw new Error("Fallback-Antwort nicht parsebar")
      }
      return parsed as ParsedCV
    } catch (fallbackErr) {
      console.error("Fallback-Parsing ebenfalls fehlgeschlagen:", fallbackErr)
      throw new Error("CV-Parsing fehlgeschlagen. Bitte versuchen Sie es erneut.")
    }
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
