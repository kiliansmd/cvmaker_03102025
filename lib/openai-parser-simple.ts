import OpenAI from "openai"

export interface SimpleParsedCV {
  name: string
  location: string
  email?: string
  phone?: string
  summary: string
  experienceYears: string
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
  }>
  skills: {
    /** Technische Skills im Format "Skill (Level)" mit Level ∈ {Experte, Sehr gut, Gut, Grundkenntnisse} */
    technical: string[]
    soft: string[]
    languages: Array<{ language: string; level: string }>
  }
  certifications: string[]
}

export async function parseWithSimpleJSON(cvText: string, additionalInfo?: string): Promise<SimpleParsedCV> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your-key")) {
    throw new Error("OPENAI_API_KEY fehlt. Bitte in .env.local oder Railway Variables setzen.")
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  const systemPrompt = `Du bist ein Experte für CV-Parsing. 
Extrahiere ALLE relevanten Informationen vollständig und konsistent.
Antworte NUR mit validem JSON im folgenden Format. Für technische Skills verwende das Format "Skill (Level)" mit Level ∈ {Experte, Sehr gut, Gut, Grundkenntnisse}. Für Sprachen nutze CEFR (z. B. C2, C1, B2).

{
  "name": "Vollständiger Name",
  "location": "Standort/Stadt",
  "email": "optional",
  "phone": "optional",
  "summary": "2-3 Sätze Zusammenfassung",
  "experienceYears": "z.B. 5+ Jahre",
  "experience": [
    {
      "title": "Jobtitel",
      "company": "Firma",
      "dateRange": "2020 - 2023",
      "description": "Kurzbeschreibung",
      "responsibilities": ["Aufgabe 1", "Aufgabe 2"]
    }
  ],
  "education": [
    {
      "degree": "Master/Bachelor/etc",
      "institution": "Uni/Hochschule",
      "dateRange": "2015 - 2018"
    }
  ],
  "skills": {
    "technical": ["Docker (Experte)", "Linux (Sehr gut)", "Kubernetes (Gut)"],
    "soft": ["Teamfähigkeit", "Kommunikation"],
    "languages": [{"language": "Deutsch", "level": "C2"}]
  },
  "certifications": ["Zertifikat 1", "Zertifikat 2"]
}

Wenn Informationen fehlen, verwende leere Arrays [] oder Platzhalter.`

  const userPrompt = `Analysiere folgenden Lebenslauf und extrahiere alle Informationen als JSON:\n\n${cvText}${
    additionalInfo ? `\n\nZusätzliche Hinweise: ${additionalInfo}` : ""
  }`

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // Einfacher JSON mode ohne strict schema
      temperature: 0.2,
      max_tokens: 3000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error("Keine Antwort von OpenAI")

    const parsed = JSON.parse(content)
    return normalizeCV(parsed)
  } catch (error: any) {
    console.error("OpenAI Parsing-Fehler:", error)
    throw new Error(`CV-Parsing fehlgeschlagen: ${error?.message || String(error)}`)
  }
}

function normalizeCV(raw: any): SimpleParsedCV {
  return {
    name: String(raw?.name || ""),
    location: String(raw?.location || ""),
    email: raw?.email ? String(raw.email) : undefined,
    phone: raw?.phone ? String(raw.phone) : undefined,
    summary: String(raw?.summary || "Keine Zusammenfassung verfügbar."),
    experienceYears: String(raw?.experienceYears || "< 1 Jahr"),
    experience: Array.isArray(raw?.experience)
      ? raw.experience.map((e: any) => ({
          title: String(e?.title || ""),
          company: String(e?.company || ""),
          dateRange: String(e?.dateRange || ""),
          description: String(e?.description || ""),
          responsibilities: Array.isArray(e?.responsibilities)
            ? e.responsibilities.map((r: any) => String(r))
            : [],
        }))
      : [],
    education: Array.isArray(raw?.education)
      ? dedupe(raw.education.map((e: any) => ({
          degree: String(e?.degree || ""),
          institution: String(e?.institution || ""),
          dateRange: String(e?.dateRange || ""),
        })))
      : [],
    skills: {
      technical: Array.isArray(raw?.skills?.technical)
        ? raw.skills.technical.map((s: any) => String(s).replace(/\s+\(\)/g, "").trim())
        : [],
      soft: Array.isArray(raw?.skills?.soft) ? raw.skills.soft.map((s: any) => String(s)) : [],
      languages: Array.isArray(raw?.skills?.languages)
        ? raw.skills.languages.map((l: any) => ({
            language: String(l?.language || ""),
            level: String(l?.level || ""),
          }))
        : [],
    },
    certifications: Array.isArray(raw?.certifications) ? raw.certifications.map((c: any) => String(c)) : [],
  }
}

function dedupe<T extends { degree?: string; institution?: string; dateRange?: string }>(arr: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const e of arr) {
    const key = `${e.degree}|${e.institution}|${e.dateRange}`
    if (!seen.has(key) && (e.degree || e.institution)) {
      seen.add(key)
      out.push(e)
    }
  }
  return out
}

