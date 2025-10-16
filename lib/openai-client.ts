import OpenAI from 'openai'
import { config } from './config'
import { withRetry } from './retry'
import { OpenAIError, ErrorCode, classifyOpenAIError } from './errors'
import { ParsedCVSchema, type ParsedCV } from './schemas'

/**
 * Singleton OpenAI Client mit Retry-Logic
 */
class OpenAIClient {
  private client: OpenAI
  private static instance: OpenAIClient | null = null

  private constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      maxRetries: 0, // Wir handhaben Retries selbst
      timeout: 60000, // 60 Sekunden
    })
  }

  static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient()
    }
    return OpenAIClient.instance
  }

  /**
   * Parse CV mit strukturiertem Output und Retry-Logic
   */
  async parseCV(cvText: string, additionalInfo?: string): Promise<ParsedCV> {
    if (!cvText || cvText.trim().length < 50) {
      throw new OpenAIError(
        ErrorCode.VALIDATION_ERROR,
        'CV-Text ist zu kurz oder leer (mindestens 50 Zeichen erforderlich)',
        { length: cvText.length }
      )
    }

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(cvText, additionalInfo)

    try {
      const response = await withRetry(
        async () => {
          return await this.client.chat.completions.create({
            model: config.OPENAI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Niedrig für konsistente Ergebnisse
            max_tokens: 3000,
          })
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          timeout: 60000,
          onRetry: (attempt, error) => {
            console.warn(`⚠️ OpenAI Retry ${attempt}/3:`, error?.message)
          },
        }
      )

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new OpenAIError(
          ErrorCode.OPENAI_INVALID_RESPONSE,
          'OpenAI hat keine Antwort zurückgegeben',
          { response }
        )
      }

      // Parse und validiere JSON
      let parsed: any
      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        throw new OpenAIError(
          ErrorCode.OPENAI_INVALID_RESPONSE,
          'OpenAI-Antwort ist kein valides JSON',
          { content, parseError }
        )
      }

      // Validiere mit Zod-Schema
      const validated = ParsedCVSchema.parse(this.normalizeOpenAIResponse(parsed))
      
      return validated
    } catch (error: any) {
      // Klassifiziere und re-throw als OpenAIError
      if (error instanceof OpenAIError) {
        throw error
      }

      const errorCode = classifyOpenAIError(error)
      throw new OpenAIError(
        errorCode,
        error.message || 'OpenAI API-Aufruf fehlgeschlagen',
        { originalError: error }
      )
    }
  }

  /**
   * Normalisiert die OpenAI-Response zu unserem Schema
   */
  private normalizeOpenAIResponse(raw: any): any {
    return {
      personalInfo: {
        name: String(raw?.personalInfo?.name || raw?.name || ''),
        location: String(raw?.personalInfo?.location || raw?.location || ''),
        email: raw?.personalInfo?.email || raw?.email || undefined,
        phone: raw?.personalInfo?.phone || raw?.phone || undefined,
        dateOfBirth: raw?.personalInfo?.dateOfBirth || undefined,
        nationality: raw?.personalInfo?.nationality || undefined,
      },
      experience: Array.isArray(raw?.experience)
        ? raw.experience.map((e: any) => ({
            title: String(e?.title || ''),
            company: String(e?.company || ''),
            dateRange: String(e?.dateRange || ''),
            description: String(e?.description || ''),
            responsibilities: Array.isArray(e?.responsibilities)
              ? e.responsibilities.map((r: any) => String(r))
              : [],
          }))
        : [],
      education: Array.isArray(raw?.education)
        ? raw.education.map((e: any) => ({
            degree: String(e?.degree || ''),
            institution: String(e?.institution || ''),
            dateRange: String(e?.dateRange || ''),
            details: e?.details ? String(e.details) : undefined,
          }))
        : [],
      skills: {
        technical: Array.isArray(raw?.skills?.technical)
          ? raw.skills.technical.map((s: any) => String(s).trim())
          : [],
        soft: Array.isArray(raw?.skills?.soft)
          ? raw.skills.soft.map((s: any) => String(s))
          : [],
        languages: Array.isArray(raw?.skills?.languages)
          ? raw.skills.languages.map((l: any) => ({
              language: String(l?.language || ''),
              level: String(l?.level || ''),
            }))
          : [],
      },
      certifications: Array.isArray(raw?.certifications)
        ? raw.certifications.map((c: any) => String(c))
        : [],
      projects: Array.isArray(raw?.projects)
        ? raw.projects.map((p: any) => ({
            title: String(p?.title || ''),
            description: String(p?.description || ''),
            technologies: Array.isArray(p?.technologies)
              ? p.technologies.map((t: any) => String(t))
              : [],
          }))
        : [],
      summary: String(raw?.summary || 'Keine Zusammenfassung verfügbar.'),
      experienceYears: String(raw?.experienceYears || '< 1 Jahr'),
    }
  }

  /**
   * Optimierter System-Prompt für CV-Parsing
   */
  private buildSystemPrompt(): string {
    return `Du bist ein Experte für CV-Parsing und Lebenslauf-Analyse.

AUFGABE:
Extrahiere ALLE relevanten Informationen aus dem Lebenslauf vollständig und strukturiert.

ANTWORT-FORMAT:
Antworte NUR mit validem JSON im folgenden exakten Format:

{
  "personalInfo": {
    "name": "Vollständiger Name",
    "location": "Stadt/Region",
    "email": "email@example.com (optional)",
    "phone": "+49... (optional)"
  },
  "summary": "2-3 Sätze Zusammenfassung der wichtigsten Qualifikationen",
  "experienceYears": "z.B. 5+ Jahre, 2-3 Jahre, < 1 Jahr",
  "experience": [
    {
      "title": "Jobtitel",
      "company": "Firmenname",
      "dateRange": "MM/YYYY - MM/YYYY oder 'Heute'",
      "description": "Kurzbeschreibung der Tätigkeit",
      "responsibilities": ["Aufgabe 1", "Aufgabe 2", "Aufgabe 3"]
    }
  ],
  "education": [
    {
      "degree": "Abschluss (z.B. Master, Bachelor, Ausbildung)",
      "institution": "Universität/Hochschule/Schule",
      "dateRange": "YYYY - YYYY"
    }
  ],
  "skills": {
    "technical": ["Skill 1 (Level)", "Skill 2 (Level)"],
    "soft": ["Teamfähigkeit", "Kommunikation", "..."],
    "languages": [
      {"language": "Deutsch", "level": "C2/Muttersprache"},
      {"language": "Englisch", "level": "B2/Fließend"}
    ]
  },
  "certifications": ["Zertifikat 1", "Zertifikat 2"]
}

WICHTIGE REGELN:
1. Für technische Skills: Verwende Format "Skill (Level)" mit Level ∈ {Experte, Sehr gut, Gut, Grundkenntnisse}
2. Für Sprachen: CEFR-Level verwenden (A1-C2) oder Beschreibung (Muttersprache, Fließend, etc.)
3. Berufserfahrung: Berechne die Gesamterfahrung basierend auf allen Positionen
4. Wenn Informationen fehlen: Verwende leere Arrays [] oder sinnvolle Platzhalter
5. Sortiere Experience nach Datum (neueste zuerst)
6. Extrahiere ALLE genannten Skills, nicht nur die wichtigsten
7. Bei Datumsangaben: Einheitliches Format MM/YYYY oder YYYY

QUALITÄT:
- Präzision und Vollständigkeit sind entscheidend
- Keine Informationen erfinden oder hinzufügen
- Bei Unklarheiten: Konservativ interpretieren`
  }

  /**
   * User-Prompt mit CV-Text und optionalen Zusatzinfos
   */
  private buildUserPrompt(cvText: string, additionalInfo?: string): string {
    let prompt = `Analysiere folgenden Lebenslauf und extrahiere alle Informationen strukturiert als JSON:\n\n${cvText}`

    if (additionalInfo && additionalInfo.trim()) {
      prompt += `\n\nZUSÄTZLICHE HINWEISE/KONTEXT:\n${additionalInfo}`
    }

    return prompt
  }

  /**
   * Health-Check: Prüft OpenAI-API-Verbindung
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch (error) {
      console.error('OpenAI Health-Check fehlgeschlagen:', error)
      return false
    }
  }
}

// Export Singleton-Instance
export const openAIClient = OpenAIClient.getInstance()

// Export für Tests/Mocking
export { OpenAIClient }

