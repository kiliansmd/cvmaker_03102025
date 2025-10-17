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
    console.log('🔑 OpenAI-Client verwendet API-Key:', config.OPENAI_API_KEY.substring(0, 15) + '...')
    console.log('🔑 OpenAI-Model:', config.OPENAI_MODEL)
    
    if (!cvText || cvText.trim().length < 50) {
      throw new OpenAIError(
        ErrorCode.VALIDATION_ERROR,
        'CV-Text ist zu kurz oder leer (mindestens 50 Zeichen erforderlich)',
        { length: cvText.length }
      )
    }

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(cvText, additionalInfo)
    
    console.log('📝 User-Prompt-Länge:', userPrompt.length, 'Zeichen')
    console.log('📝 System-Prompt-Länge:', systemPrompt.length, 'Zeichen')

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
        console.log('📊 ===== OpenAI RAW RESPONSE =====')
        console.log(JSON.stringify(parsed, null, 2))
        console.log('📊 ===== END RAW RESPONSE =====')
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError)
        console.error('❌ Content:', content)
        throw new OpenAIError(
          ErrorCode.OPENAI_INVALID_RESPONSE,
          'OpenAI-Antwort ist kein valides JSON',
          { content, parseError }
        )
      }

      // Normalisiere Response
      const normalized = this.normalizeOpenAIResponse(parsed)
      console.log('🔄 ===== NORMALISIERTE DATEN =====')
      console.log('Experience:', JSON.stringify(normalized.experience, null, 2))
      console.log('Skills:', JSON.stringify(normalized.skills, null, 2))
      console.log('Education:', JSON.stringify(normalized.education, null, 2))
      console.log('Certifications:', normalized.certifications)
      console.log('Summary:', normalized.summary)
      console.log('ExperienceYears:', normalized.experienceYears)
      console.log('🔄 ===== END NORMALISIERTE DATEN =====')
      console.log('📊 Counts:', {
        experienceCount: normalized.experience?.length || 0,
        skillsCount: normalized.skills?.technical?.length || 0,
        educationCount: normalized.education?.length || 0,
        certificationsCount: normalized.certifications?.length || 0,
      })

      // Validiere mit Zod-Schema (sanft - mit safeParse)
      const validationResult = ParsedCVSchema.safeParse(normalized)
      
      if (!validationResult.success) {
        console.warn('⚠️ Zod-Validierung fehlgeschlagen, nutze normalisierte Daten trotzdem:', validationResult.error.errors)
        // Nutze normalisierte Daten auch wenn Zod-Validierung fehlschlägt
        return normalized as ParsedCV
      }
      
      return validationResult.data
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
   * Normalisiere OpenAI-Response mit robusten Fallbacks
   */
  private normalizeOpenAIResponse(raw: any): ParsedCV {
    console.log("📝 Normalisiere OpenAI-Response...")

    // Extrahiere nested structures
    const personalInfo = raw?.personalInfo || {}
    const skills = raw?.skills || {}

    const normalized = {
      personalInfo: {
        name: String(personalInfo?.name || raw?.name || '').trim(),
        location: String(personalInfo?.location || raw?.location || '').trim(),
        email: personalInfo?.email || raw?.email || undefined,
        phone: personalInfo?.phone || raw?.phone || undefined,
        dateOfBirth: personalInfo?.dateOfBirth || undefined,
        nationality: personalInfo?.nationality || undefined,
      },
      experience: Array.isArray(raw?.experience)
        ? raw.experience
            .filter((e: any) => e && (e.title || e.company)) // Nur Einträge mit Title oder Company
            .map((e: any) => {
              const title = String(e?.title || e?.position || '').trim()
              const company = String(e?.company || e?.employer || '').trim()
              const dateRange = String(e?.dateRange || e?.duration || e?.period || '').trim()
              const description = String(e?.description || e?.summary || '').trim()
              
              // Validierung: Mindestens Title oder Company sollte vorhanden sein
              if (!title && !company) return null
              
              return {
                title: title || '(Keine Position)',
                company: company || '(Firma nicht angegeben)',
                dateRange: dateRange || '(Zeitraum nicht angegeben)',
                description: description || '',
                responsibilities: Array.isArray(e?.responsibilities)
                  ? e.responsibilities.map((r: any) => String(r).trim()).filter((r: string) => r.length > 0)
                  : Array.isArray(e?.tasks)
                  ? e.tasks.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0)
                  : [],
              }
            })
            .filter((e: any) => e !== null)
        : [],
      education: Array.isArray(raw?.education)
        ? raw.education
            .filter((e: any) => e && (e.degree || e.institution)) // Nur Einträge mit Degree oder Institution
            .map((e: any) => {
              const degree = String(e?.degree || e?.qualification || '').trim()
              const institution = String(e?.institution || e?.school || e?.university || '').trim()
              
              // Validierung
              if (!degree && !institution) return null
              
              return {
                degree: degree || '(Abschluss nicht angegeben)',
                institution: institution || '(Institution nicht angegeben)',
                dateRange: String(e?.dateRange || e?.duration || e?.period || e?.year || '').trim() || '',
                details: e?.details || e?.field || e?.major ? String(e.details || e.field || e.major).trim() : undefined,
              }
            })
            .filter((e: any) => e !== null)
        : [],
      skills: {
        technical: Array.isArray(skills?.technical)
          ? skills.technical
              .map((s: any) => String(s).trim())
              .filter((s: string) => s.length > 0)
          : Array.isArray(raw?.technicalSkills)
          ? raw.technicalSkills.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0)
          : [],
        soft: Array.isArray(skills?.soft)
          ? skills.soft
              .map((s: any) => String(s).trim())
              .filter((s: string) => s.length > 0)
          : Array.isArray(skills?.softSkills)
          ? skills.softSkills.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0)
          : [],
        languages: Array.isArray(skills?.languages)
          ? skills.languages
              .filter((l: any) => l && (l.language || l.lang))
              .map((l: any) => ({
                language: String(l?.language || l?.lang || '').trim(),
                level: String(l?.level || l?.proficiency || '').trim(),
              }))
              .filter((l: any) => l.language.length > 0)
          : [],
      },
      certifications: Array.isArray(raw?.certifications)
        ? raw.certifications
            .map((c: any) => String(c).trim())
            .filter((c: string) => c.length > 0)
        : Array.isArray(raw?.certificates)
        ? raw.certificates.map((c: any) => String(c).trim()).filter((c: string) => c.length > 0)
        : [],
      projects: Array.isArray(raw?.projects)
        ? raw.projects
            .filter((p: any) => p && p.title)
            .map((p: any) => ({
              title: String(p?.title || '').trim(),
              description: String(p?.description || p?.summary || '').trim(),
              technologies: Array.isArray(p?.technologies)
                ? p.technologies.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0)
                : Array.isArray(p?.tech)
                ? p.tech.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0)
                : [],
            }))
        : [],
      summary: String(raw?.summary || raw?.profile || raw?.about || '').trim(),
      experienceYears: String(raw?.experienceYears || raw?.totalExperience || raw?.yearsOfExperience || '').trim(),
    }

    // Logging für Qualitätskontrolle
    console.log("📊 ===== NORMALISIERTE DATEN =====")
    console.log("👤 Name:", normalized.personalInfo.name || "(leer)")
    console.log("📍 Location:", normalized.personalInfo.location || "(leer)")
    console.log("💼 Experience-Einträge:", normalized.experience.length)
    if (normalized.experience.length > 0) {
      console.log("   - Erste Position:", normalized.experience[0].title, "bei", normalized.experience[0].company)
      console.log("   - Responsibilities:", normalized.experience[0].responsibilities.length, "Punkte")
    }
    console.log("🎓 Education-Einträge:", normalized.education.length)
    if (normalized.education.length > 0) {
      console.log("   - Erste:", normalized.education[0].degree, "von", normalized.education[0].institution)
    }
    console.log("💡 Technical Skills:", normalized.skills.technical.length)
    console.log("🤝 Soft Skills:", normalized.skills.soft.length)
    console.log("🗣️ Sprachen:", normalized.skills.languages.length)
    console.log("📜 Zertifizierungen:", normalized.certifications.length)
    console.log("🚀 Projekte:", normalized.projects.length)
    console.log("📊 ===== END NORMALISIERTE DATEN =====")

    return normalized as ParsedCV
  }

  /**
   * Optimierter System-Prompt für CV-Parsing
   */
  private buildSystemPrompt(): string {
    return `Du bist ein hochspezialisierter Experte für CV-Parsing, Lebenslauf-Analyse und Jobprofil-Erstellung.

KRITISCHE AUFGABE:
Extrahiere ALLE Informationen aus dem Lebenslauf mit HÖCHSTER PRÄZISION und VOLLSTÄNDIGKEIT:
- EXAKTE Jobtitel (nicht interpretieren oder umschreiben)
- EXAKTE Firmennamen (nicht anonymisieren)
- EXAKTE Personennamen (nicht anonymisieren)
- KLARE Trennung zwischen Position/Rolle und Verantwortlichkeiten
- VOLLSTÄNDIGE Skill-Listen (JEDE fachliche Kompetenz, JEDES Tool, JEDES System, JEDE Methode)
- KORREKTE zeitliche Einordnung mit Monaten und Jahren
- BRANCHENSPEZIFISCHE Terminologie beibehalten

KEINE ANONYMISIERUNG:
✅ Übernimm Namen wie sie stehen: "Max Mustermann" → "Max Mustermann" (nicht "Candidate A" oder "Person XYZ")
✅ Übernimm Firmennamen: "Microsoft GmbH" → "Microsoft GmbH" (nicht "Tech Company" oder "Company X")
✅ Übernimm Projektbezeichnungen: "SAP S/4HANA Migration" → "SAP S/4HANA Migration" (nicht "Project 1")

ANTWORT-FORMAT (STRIKT EINHALTEN):
Antworte NUR mit validem JSON in diesem EXAKTEN Format:

{
  "personalInfo": {
    "name": "Vollständiger Name exakt wie im CV (NICHT anonymisiert)",
    "location": "Stadt/Region exakt wie angegeben",
    "email": "email@example.com oder Wert aus CV oder null",
    "phone": "+49... oder Wert aus CV oder null"
  },
  "summary": "2-3 prägnante Sätze, die die Kernkompetenzen und Erfahrung zusammenfassen - BASIEREND auf realen CV-Daten",
  "experienceYears": "Berechne die Gesamtjahre EXAKT (z.B. '8+ Jahre', '3-5 Jahre', '< 1 Jahr')",
  "experience": [
    {
      "title": "EXAKTER Jobtitel wie im CV - NICHT verändern oder neu formulieren",
      "company": "Firmenname EXAKT wie angegeben - NICHT anonymisieren",
      "dateRange": "MM/YYYY - MM/YYYY oder 'Heute' (exakt wie im CV oder rekonstruiert)",
      "description": "1-2 Sätze zum Unternehmensbereich/Kontext - BASIEREND auf CV-Inhalten",
      "responsibilities": [
        "Konkrete Aufgabe 1 - EXAKT wie beschrieben, mit verwendeten Tools/Technologien",
        "Konkrete Aufgabe 2 - Mit Erfolgen/Achievements wenn erwähnt",
        "Konkrete Aufgabe 3 - Mit Technologien/Methoden",
        "Min. 3-6 konkrete, detaillierte Punkte"
      ]
    }
  ],
  "education": [
    {
      "degree": "Vollständiger Titel - NICHT abkürzen (z.B. 'Master of Science Informatik', 'Bachelor of Arts BWL', 'Berufsausbildung als Fachinformatiker')",
      "institution": "Vollständiger Name der Institution - EXAKT wie im CV",
      "dateRange": "YYYY - YYYY oder genaue Daten wenn verfügbar",
      "details": "Schwerpunkt/Spezialisierung wenn erwähnt"
    }
  ],
  "skills": {
    "technical": [
      "JEDE fachliche Kompetenz erwähnt im CV mit Level 'Name (Level)' Format",
      "ALLE Technologien, Tools, Systeme, Methoden - nicht nur bekannte oder populäre",
      "IT-Beispiele: 'SAP HCM (Experte)', 'Python (Sehr gut)', 'Docker (Gut)', 'Kubernetes (Gut)', 'Agile Methoden (Experte)'",
      "Non-IT-Beispiele: 'Vertragsverhandlung (Experte)', 'Change Management (Sehr gut)', 'Budgetplanung (Gut)', 'Stakeholder-Management (Experte)'",
      "Beratung: 'Strategieberatung (Experte)', 'Prozessoptimierung (Sehr gut)', 'Digital Transformation (Gut)'",
      "Handwerk: 'CNC-Programmierung (Experte)', 'Qualitätssicherung (Sehr gut)', 'CAD/CAM (Gut)'",
      "Level-Schätzung basiert auf: Jahre Erfahrung (exakt vom CV), Anzahl Projekte, Zertifikate, Führungsverantwortung",
      "KEINE Generika oder Annahmen - nur ECHTE Fähigkeiten aus dem CV"
    ],
    "soft": [
      "ALLE Soft Skills und überfachliche Kompetenzen - explizit genannt ODER detailliert aus Kontext ableitbar",
      "Beispiele: 'Führungskompetenz (aus Führungsrolle)', 'Verhandlungsgeschick (aus Projektbeschreibung)', 'Kundenorientierung', 'Analytisches Denken', 'Teamfähigkeit'",
      "Min. 5-8 Punkte, nur wenn echte Hinweise im CV vorhanden"
    ],
    "languages": [
      {"language": "Exakter Sprachname", "level": "Muttersprache / C2 / C1 / B2 / B1 / A2 / A1 / Fließend / Verhandlungssicher / Grundkenntnisse"}
    ]
  },
  "certifications": [
    "Vollständige Namen aller Zertifikate/Lizenzen - EXAKT wie angegeben",
    "Mit ausstellender Organisation wenn genannt",
    "KEINE erfundenen Zertifikate"
  ],
  "projects": [
    {
      "title": "Projektname - EXAKT wie beschrieben",
      "description": "Was wurde gemacht - konkret und detailliert",
      "technologies": ["Technology/Tool 1", "Technology/Tool 2", "..."]
    }
  ]
}

KRITISCHE PARSING-REGELN:

1. KEINE ANONYMISIERUNG:
   ✅ Übernimm alle Namen, Firmennamen, Orte, Projektnamen EXAKT
   ✅ "John Smith" → "John Smith" (nicht "Candidate A")
   ✅ "Google" → "Google" (nicht "Tech Company")
   ✅ "Berlin" → "Berlin" (nicht "City X")

2. JOBTITEL (title):
   ✅ EXAKT übernehmen wie im CV angegeben - NICHT umformulieren
   ✅ "Senior SAP HCM Consultant" → "Senior SAP HCM Consultant" (NICHT: "SAP Berater")
   ✅ "Full-Stack JavaScript Developer" → "Full-Stack JavaScript Developer" (NICHT: "Entwickler")
   ✅ "IT-Projektleiter Digital Transformation" → "IT-Projektleiter Digital Transformation" (NICHT: "Projektmanager")
   ✅ NIEMALS: Verantwortlichkeiten ins title-Feld

3. ROLLEN vs. AUFGABEN:
   ✅ title = Was die Person WAR (Jobtitel wie im CV)
   ✅ responsibilities = Was die Person TAT (konkrete Tätigkeiten und Erfolge)
   ✅ description = Kontext zum Unternehmen/Bereich

4. SKILLS-EXTRAKTION (BRANCHENUNABHÄNGIG + VOLLSTÄNDIG):
   ✅ Extrahiere JEDE genannte Fähigkeit, Kompetenz, Tool, Methode, System - KEINE Auslassungen
   ✅ Funktioniert für ALLE Branchen - IT, Beratung, Management, Handwerk, Medizin, Marketing, etc.
   ✅ Schätze Level basierend auf EXAKTEN Informationen vom CV:
      - "5 Jahre Erfahrung" → "5 Jahre Erfahrung (Experte/Sehr gut)"
      - "20 Projekte mit X" → "Experte"
      - "Zertifiziert in X" → "Experte"
      - "Verwendet in 3 Rollen" → "Gut"
   ✅ Format: "Kompetenz (Level)" z.B. "SAP HCM (Experte)", "Change Management (Sehr gut)", "Python (Gut)"

5. FIRMENNAMEN + DATEN:
   ✅ Übernimm exakt wie im CV: "Siemens AG" nicht "Siemens" nicht "Siemens Company"
   ✅ Datumsbereiche: Falls im CV "März 2019 - Dezember 2022", dann "03/2019 - 12/2022"
   ✅ Wenn aktuell: "01/2024 - Heute" oder "Heute" wenn Monat nicht genannt

6. RESPONSIBILITIES - KONKRETE UND DETAILLIERTE PUNKTE:
   ✅ NICHT: "Entwicklung", "Management", "Beratung" ← Zu vage
   ✅ SONDERN: "Entwicklung von React-Frontend-Komponenten mit Redux State Management für E-Commerce-Platform"
   ✅ NICHT: "SAP" ← Was genau?
   ✅ SONDERN: "SAP HCM Implementierung für 500+ Mitarbeiter, User-Acceptance-Testing und Training durchgeführt"
   ✅ Mit Erfolgen/Metriken wenn im CV genannt: "30% Effizienzsteigerung durch Automatisierung"

QUALITÄTSKONTROLLE:
- Lies den CV MINIMUM 2x durch bevor du antwortest
- Prüfe: Sind ALLE Skills extrahiert? (Check: Wurden alle Technologien/Tools genannt?)
- Prüfe: Sind die Jobtitel EXAKT wie im CV?
- Prüfe: Sind die Verantwortlichkeiten konkret, detailliert und mit Tools/Technologien versehen?
- Prüfe: Stimmen Namen, Firmen, Orte exakt?
- Prüfe: Stimmen Datumsangaben?

KEINE ERFINDUNGEN:
- Wenn ein Skill-Level unklar ist: Schätze KONSERVATIV oder lass weg
- Wenn eine Information fehlt: Leere Strings oder null verwenden
- NIEMALS Informationen hinzufügen, die nicht im CV stehen
- NIEMALS anonymisieren
- NIEMALS "vereinfachen" oder "verbessern"`
  }

  /**
   * User-Prompt mit CV-Text und optionalen Zusatzinfos
   */
  private buildUserPrompt(cvText: string, additionalInfo?: string): string {
    let prompt = `Analysiere den folgenden Lebenslauf VOLLSTÄNDIG, PRÄZISE und BRANCHENUNABHÄNGIG.

KRITISCHE ANFORDERUNGEN:
- Übernimm Jobtitel EXAKT wie im CV angegeben (nicht umschreiben oder "verbessern")
- Extrahiere ALLE Fähigkeiten, Kompetenzen, Tools, Methoden (nicht nur IT/Technologie)
- Unterscheide klar zwischen Position (title) und Tätigkeiten (responsibilities)
- Behalte branchenspezifische Terminologie bei
- Erkenne Soft Skills aus Beschreibungen und Führungsrollen

LEBENSLAUF:
${cvText}`

    if (additionalInfo && additionalInfo.trim()) {
      prompt += `\n\n--- ZUSÄTZLICHER KONTEXT / ZIELPOSITION ---
${additionalInfo}

WICHTIG: Nutze diese Informationen zur:
- Besseren Einordnung der Relevanz von Skills
- Optimierung der Darstellung für die Zielposition
- Hervorhebung relevanter Erfahrungen
- ABER: Erfinde KEINE Informationen die nicht im CV stehen!`
    }

    prompt += `\n\n--- AUFTRAG ---
Extrahiere nun ALLE Informationen als vollständig strukturiertes JSON gemäß dem vorgegebenen Format.
Achte besonders auf VOLLSTÄNDIGKEIT und GENAUIGKEIT der Jobtitel und Fachkompetenzen.`

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

