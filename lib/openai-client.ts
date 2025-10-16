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
            temperature: 0.2, // Leicht erhöht für besseres Verständnis bei komplexen CVs
            max_tokens: 4000, // Erhöht für längere CVs und vollständige Extraktion
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
    return `Du bist ein hochspezialisierter Experte für CV-Parsing, Lebenslauf-Analyse und Jobprofil-Erstellung.

KRITISCHE AUFGABE:
Extrahiere ALLE Informationen aus dem Lebenslauf mit HÖCHSTER PRÄZISION. Achte besonders auf:
- EXAKTE Jobtitel (nicht interpretieren oder umschreiben)
- KLARE Trennung zwischen Position/Rolle und Verantwortlichkeiten
- VOLLSTÄNDIGE Skill-Listen (ALLE erwähnten Technologien/Tools)
- KORREKTE zeitliche Einordnung

ANTWORT-FORMAT (STRIKT EINHALTEN):
Antworte NUR mit validem JSON in diesem EXAKTEN Format:

{
  "personalInfo": {
    "name": "Vollständiger Name (exakt wie im CV)",
    "location": "Stadt/Region (exakt wie angegeben)",
    "email": "email@example.com",
    "phone": "+49..."
  },
  "summary": "2-3 prägnante Sätze, die die Kernkompetenzen und Erfahrung zusammenfassen",
  "experienceYears": "Berechne die Gesamtjahre korrekt (z.B. '8+ Jahre', '3-5 Jahre', '< 1 Jahr')",
  "experience": [
    {
      "title": "EXAKTER Jobtitel wie im CV (z.B. 'Senior SAP HCM Consultant', 'Full-Stack Developer', 'IT-Projektleiter')",
      "company": "Firmenname (exakt)",
      "dateRange": "MM/YYYY - MM/YYYY oder 'Heute' (z.B. '03/2020 - Heute', '2018 - 2020')",
      "description": "1-2 Sätze Kontext zur Position und dem Unternehmensbereich",
      "responsibilities": [
        "Konkrete Aufgabe 1 (was wurde gemacht)",
        "Konkrete Aufgabe 2 (Technologien/Methoden genannt)",
        "Konkrete Aufgabe 3 (Erfolge/Projekte)"
      ]
    }
  ],
  "education": [
    {
      "degree": "Vollständiger Abschluss (z.B. 'Master of Science Informatik', 'Bachelor BWL', 'Ausbildung Fachinformatiker')",
      "institution": "Vollständiger Name der Institution",
      "dateRange": "YYYY - YYYY (z.B. '2015 - 2018')"
    }
  ],
  "skills": {
    "technical": [
      "Jedes einzelne Tool/Technologie im Format 'Name (Level)'",
      "Beispiele: 'SAP HCM (Experte)', 'Python (Sehr gut)', 'Docker (Gut)', 'Git (Grundkenntnisse)'",
      "Level basiert auf Kontext: Jahre Erfahrung, Projektanzahl, Zertifikate"
    ],
    "soft": [
      "Explizit genannte Soft Skills",
      "Aus Beschreibungen ableitbar (z.B. 'Teamleitung' → 'Führungskompetenz')"
    ],
    "languages": [
      {"language": "Deutsch", "level": "Muttersprache / C2 / C1 / B2 / B1 / A2 / A1"},
      {"language": "Englisch", "level": "Verwende CEFR oder Beschreibung wie 'Fließend', 'Verhandlungssicher'"}
    ]
  },
  "certifications": [
    "Vollständige Namen aller Zertifikate",
    "Inklusive ausstellende Organisation wenn genannt"
  ]
}

KRITISCHE PARSING-REGELN:

1. JOBTITEL (title):
   ✅ EXAKT übernehmen wie im CV angegeben
   ✅ NICHT umformulieren oder "verbessern"
   ✅ NICHT mit Verantwortlichkeiten verwechseln
   ✅ Beispiele KORREKT:
      - "Senior SAP HCM Consultant" (NICHT: "SAP Berater")
      - "Full-Stack JavaScript Developer" (NICHT: "Entwickler")
      - "IT-Projektleiter Digital Transformation" (NICHT: "Projektmanager")
   
2. ROLLEN vs. AUFGABEN:
   ✅ title = Was die Person WAR (Jobtitel/Position)
   ✅ responsibilities = Was die Person TAT (Tätigkeiten)
   ✅ NIEMALS in title: "Entwicklung von...", "Beratung für..." → Das gehört in responsibilities

3. SKILLS-EXTRAKTION:
   ✅ Extrahiere JEDES genannte Tool, jede Technologie, jede Methodik
   ✅ Schätze Level basierend auf:
      - Anzahl Jahre Nutzung
      - Anzahl Projekte damit
      - Vorhandene Zertifikate
      - Position/Seniority
   ✅ Format: "Toolname (Level)" z.B. "SAP SuccessFactors (Experte)"

4. EXPERIENCE-YEARS:
   ✅ Berechne TOTAL über ALLE Positionen
   ✅ Berücksichtige Überlappungen (Teilzeit/Freiberuflich)
   ✅ Formate: "< 1 Jahr", "1-2 Jahre", "3-5 Jahre", "5-8 Jahre", "8-10 Jahre", "10+ Jahre", "15+ Jahre"

5. VERANTWORTLICHKEITEN (responsibilities):
   ✅ Konkrete, messbare Tätigkeiten
   ✅ Mit verwendeten Technologien/Tools
   ✅ Erfolge/Achievements separat nennen
   ✅ 3-6 Punkte pro Position

6. EDUCATION:
   ✅ Vollständiger Titel (nicht abkürzen)
   ✅ "Master of Science Informatik" statt "M.Sc. Informatik"
   ✅ "Bachelor of Arts BWL" statt "B.A. BWL"

BEISPIEL KORREKT vs. FALSCH:

❌ FALSCH:
{
  "experience": [{
    "title": "Entwicklung von Web-Anwendungen",  ← Das ist eine Tätigkeit, kein Titel!
    "company": "Tech GmbH",
    "responsibilities": ["Frontend", "Backend"]  ← Zu vage
  }]
}

✅ KORREKT:
{
  "experience": [{
    "title": "Senior Full-Stack Developer",  ← Exakter Jobtitel
    "company": "Tech GmbH",
    "description": "Entwicklung unternehmenskritischer Web-Anwendungen im E-Commerce-Bereich",
    "responsibilities": [
      "Entwicklung von React-Frontend-Komponenten mit TypeScript",
      "Implementierung von REST-APIs mit Node.js und Express",
      "Datenbank-Design und -Optimierung (PostgreSQL)",
      "Code-Reviews und Mentoring von Junior-Entwicklern"
    ]
  }]
}

QUALITÄTSKONTROLLE:
- Lies den CV 2x durch bevor du antwortest
- Prüfe: Sind ALLE Skills extrahiert?
- Prüfe: Sind die Jobtitel EXAKT übernommen?
- Prüfe: Sind die Verantwortlichkeiten konkret und detailliert?
- Prüfe: Stimmen die Zeiträume?

KEINE ERFINDUNGEN:
- Wenn ein Skill-Level unklar ist: Schätze konservativ ("Gut" statt "Experte")
- Wenn eine Information fehlt: Leere Strings oder Arrays
- NIEMALS Informationen hinzufügen, die nicht im CV stehen`
  }

  /**
   * User-Prompt mit CV-Text und optionalen Zusatzinfos
   */
  private buildUserPrompt(cvText: string, additionalInfo?: string): string {
    let prompt = `Analysiere den folgenden Lebenslauf VOLLSTÄNDIG und PRÄZISE.

WICHTIG: 
- Übernimm Jobtitel EXAKT wie angegeben (nicht umschreiben!)
- Extrahiere ALLE Skills und Technologien
- Unterscheide klar zwischen Position (title) und Tätigkeiten (responsibilities)

LEBENSLAUF:
${cvText}`

    if (additionalInfo && additionalInfo.trim()) {
      prompt += `\n\n--- ZUSÄTZLICHER KONTEXT ---
${additionalInfo}

Nutze diese Informationen zur Ergänzung und besseren Einordnung der CV-Daten.`
    }

    prompt += `\n\nExtrahiere nun ALLE Informationen als strukturiertes JSON gemäß dem vorgegebenen Format.`

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

