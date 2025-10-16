import type { ParsedCV, CandidateProfile } from "./schemas"

// Legacy type export für Backward Compatibility
export type CandidateProfileData = CandidateProfile

export interface __CandidateProfileData_DEPRECATED {
  title: string
  salaryExpectation: string
  availability: string
  location: string
  experienceYears: string
  initials: string
  contactPerson: {
    name: string
    phone: string
    email: string
    website: string
  }
  profileSummary: string[]
  topSkills: Array<{
    id: string
    name: string
    description: string
    icon: any
  }>
  qualifications: string[]
  personalDetails: Array<{
    label: string
    value: string
  }>
  itSkills: Array<{
    skill: string
    level: string
  }>
  languages: Array<{
    lang: string
    level: string
  }>
  education: string[]
  keyProjects: Array<{
    id: string
    title: string
    category: string
    description: string
    tags: string[]
    scope: string
    icon: any
  }>
  experienceTimeline: Array<{
    id: string
    dateRange: string
    title: string
    description: string
  }>
  careerGoals: Array<{
    title: string
    description: string
    icon: any
  }>
  interests: Array<{
    name: string
    icon: any
  }>
  personalityTraits: string[]
  motivationFactors: string[]
}

// Wichtiger Hinweis:
// In Client Components dürfen keine Funktionen/Komponenten als Daten übergeben werden.
// Daher verwenden wir für Icons keine React-Komponenten mehr, sondern setzen sie auf null
// oder könnten alternativ string-Keys verwenden und in der Client-Komponente mappen.

export function generateProfileFromParsedCV(
  parsedCV: ParsedCV,
  formData: {
    position: string
    salary: string
    availability: string
    contactPerson: string
    contactPhone: string
    contactEmail: string
  },
): CandidateProfileData {
  // Generiere Initialen
  const nameParts = (parsedCV.personalInfo.name || "").split(" ")
  const initials = nameParts.map((part) => part[0]).join(".")

  // Generiere Profil-Zusammenfassung (3 Absätze) - nutze tatsächliche CV-Daten
  const latestRole = parsedCV.experience?.[0]?.title || formData.position
  const topSkillsText = (parsedCV.skills.technical || [])
    .slice(0, 4)
    .map(s => s.replace(/\s*\(.+?\)$/, '')) // Entferne Level-Klammern für bessere Lesbarkeit
    .join(", ") || "moderne Technologien"
  
  const profileSummary = [
    `${latestRole} mit ${parsedCV.experienceYears} relevanter Berufserfahrung. ${parsedCV.summary}`,
    `Kernkompetenzen: ${topSkillsText}. ${
      parsedCV.experience?.[0] 
        ? `Aktuelle Tätigkeit bei ${parsedCV.experience[0].company} als ${parsedCV.experience[0].title}.`
        : `Projektpraxis bei führenden Unternehmen.`
    }`,
    `Arbeitsweise: ${
      (parsedCV.skills.soft || []).slice(0, 2).join(", ") || "analytisch, strukturiert und lösungsorientiert"
    }. Fokus auf messbare Ergebnisse und nachhaltige Lösungen in enger Zusammenarbeit mit Stakeholdern.`,
  ]

  // Generiere Top Skills (max 4)
  const topSkills = generateTopSkills(parsedCV)

  // Generiere Qualifikationen - kombiniere die wichtigsten Aspekte
  const qualifications = [
    // Zertifikate zuerst (wichtigste Credentials)
    ...(parsedCV.certifications || []).slice(0, 3),
    // Berufserfahrung
    `${parsedCV.experienceYears || "Mehrjährige"} praktische Berufserfahrung`,
    // Bildungsabschlüsse
    ...((parsedCV.education || []).slice(0, 2).map((edu) => `${edu.degree}, ${edu.institution}`)),
    // Top 3 Technical Skills (ohne Level-Klammern)
    ...((parsedCV.skills.technical || [])
      .slice(0, 3)
      .map((skill) => {
        const cleanSkill = skill.replace(/\s*\(.+?\)$/, '')
        return `Expertise in ${cleanSkill}`
      })
    ),
  ].filter(q => q && q.length > 0) // Entferne leere Einträge

  // Generiere Personal Details - nutze CV-Daten wo möglich
  const currentPosition = parsedCV.experience?.[0]?.title || formData.position
  const topTechnologies = (parsedCV.skills.technical || [])
    .slice(0, 3)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .join(" + ") || "Technologien"
  
  const personalDetails = [
    { label: "Verfügbarkeit", value: `Verfügbar in ${formData.availability}` },
    { label: "Gehaltsvorstellung", value: formData.salary },
    { label: "Standort", value: parsedCV.personalInfo?.location || "-" },
    { label: "Arbeitsmodell", value: "Vollzeit (Hybrid/Remote möglich)" },
    { label: "Aktuelle Position", value: currentPosition },
    {
      label: "Berufserfahrung",
      value: `${parsedCV.experienceYears} in ${(parsedCV.experience || []).length} Position${(parsedCV.experience || []).length !== 1 ? 'en' : ''}`,
    },
    {
      label: "Kernkompetenzen",
      value: topTechnologies,
    },
    {
      label: "Sprachkenntnisse",
      value: (parsedCV.skills.languages || []).length > 0
        ? (parsedCV.skills.languages || []).map((l) => `${l.language} (${l.level})`).join(", ")
        : "-",
    },
  ].filter(d => d.value && d.value !== "-" && d.value.length > 0)

  // Generiere IT Skills - nutze Level aus Parsing wenn vorhanden
  const itSkills = (parsedCV.skills.technical || []).map((skill, index) => {
    // Prüfe ob Skill bereits Level-Info enthält: "Skill (Level)"
    const match = skill.match(/^(.+?)\s*\((.+?)\)$/)
    if (match) {
      const [, skillName, skillLevel] = match
      return {
        skill: skillName.trim(),
        level: skillLevel.trim(),
      }
    }
    
    // Fallback: Schätze Level basierend auf Position in der Liste
    return {
      skill,
      level: index < 3 ? "Expertenkenntnisse" : index < 6 ? "Sehr gute Kenntnisse" : "Gute Kenntnisse",
    }
  })

  // Languages
  const languages = (parsedCV.skills.languages || []).map((l) => ({
    lang: l.language,
    level: l.level,
  }))

  // Education
  const education = [
    ...((parsedCV.education || []).map((edu) => `${edu.degree}, ${edu.institution} (${edu.dateRange})`)),
    ...((parsedCV.certifications || [])),
  ]

  // Key Projects (aus Experience)
  const keyProjects = (parsedCV.experience || []).slice(0, 5).map((exp, index) => ({
    id: `p${index + 1}`,
    title: `${exp.title} bei ${exp.company}`,
    category: index === 0 ? "Aktuelle Position" : "Berufserfahrung",
    description: exp.description,
    tags: (exp.responsibilities || []).slice(0, 4),
    scope: `Erfolgreiche ${exp.title}-Tätigkeit bei ${exp.company}.`,
    icon: null,
  }))

  // Experience Timeline
  const experienceTimeline = (parsedCV.experience || []).map((exp, index) => ({
    id: `exp_${index}`,
    dateRange: exp.dateRange,
    title: `${exp.title}, ${exp.company}`,
    description: exp.description,
  }))

  // Career Goals - basierend auf aktueller Position und Skills
  const currentRole = parsedCV.experience?.[0]?.title || formData.position
  const topTwoSkills = (parsedCV.skills.technical || [])
    .slice(0, 2)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .join(" und ")
  
  const careerGoals = [
    {
      title: currentRole.includes('Senior') || currentRole.includes('Lead') 
        ? `Expert ${currentRole}` 
        : `Senior ${currentRole}`,
      description: `Weiterentwicklung mit vertiefter Expertise und strategischer Verantwortung für komplexe Projekte und technische Führung.`,
      icon: null,
    },
    {
      title: "Teamleitung / Management",
      description: `Aufbau zur Teamleitung oder Management-Position mit Fokus auf Mitarbeiterentwicklung und strategische Planung.`,
      icon: null,
    },
    {
      title: "Spezialisierung",
      description: topTwoSkills 
        ? `Vertiefung der Expertise in ${topTwoSkills} für spezialisierte Beratungsdienstleistungen.`
        : "Vertiefung der Fachexpertise für spezialisierte Projekte.",
      icon: null,
    },
  ]

  // Interests (aus Skills) - ohne Level-Klammern
  const interests = (parsedCV.skills.technical || [])
    .slice(0, 4)
    .map((skill) => ({
      name: skill.replace(/\s*\(.+?\)$/, ''), // Entferne Level-Info
      icon: null,
    }))

  // Personality Traits - kombiniere Erfahrung, Bildung und Skills
  const topThreeSkills = (parsedCV.skills.technical || [])
    .slice(0, 3)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .join(", ")
  
  const personalityTraits = [
    `${parsedCV.experienceYears || "Mehrjährige"} Berufserfahrung mit kontinuierlicher Weiterentwicklung`,
    `${parsedCV.education?.[0]?.degree || "Akademischer Hintergrund"}`,
    ...((parsedCV.certifications || []).slice(0, 2)),
    topThreeSkills ? `Expertise in ${topThreeSkills}` : "",
    ...((parsedCV.skills.soft || []).slice(0, 2)),
  ].filter((t): t is string => typeof t === 'string' && t.length > 0)

  // Motivation Factors - basierend auf tatsächlichen Skills
  const topTwoSkillsClean = (parsedCV.skills.technical || [])
    .slice(0, 2)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .join(" und ")
  
  const motivationFactors = [
    topTwoSkillsClean ? `Arbeit mit ${topTwoSkillsClean}` : "Arbeit mit modernen Technologien",
    "Entwicklung und Optimierung komplexer Systeme",
    "Kontinuierliche Weiterbildung in zukunftsweisenden Technologien",
    "Zusammenarbeit in interdisziplinären Teams",
  ].filter(m => m && m.length > 0)

  // Verwende die aktuellste Rolle aus dem CV, falls vorhanden, sonst Formular-Input
  const profileTitle = parsedCV.experience?.[0]?.title || formData.position

  return {
    title: profileTitle,
    salaryExpectation: formData.salary,
    availability: `Verfügbar in ${formData.availability}`,
    location: parsedCV.personalInfo.location,
    experienceYears: parsedCV.experienceYears,
    initials,
    contactPerson: {
      name: `Herr ${formData.contactPerson}`,
      phone: formData.contactPhone,
      email: formData.contactEmail,
      website: "www.getexperts.io",
    },
    profileSummary,
    topSkills,
    qualifications,
    personalDetails,
    itSkills,
    languages,
    education,
    keyProjects,
    experienceTimeline,
    careerGoals,
    interests,
    personalityTraits,
    motivationFactors,
  }
}

function generateTopSkills(parsedCV: ParsedCV): Array<{
  id: string
  name: string
  description: string
  icon: any
}> {
  const topSkills: Array<{
    id: string
    name: string
    description: string
    icon: any
  }> = []

  // Skill 1: Aktuelle/Letzte Position (mit exaktem Jobtitel)
  if ((parsedCV.experience || [])[0]) {
    const exp = parsedCV.experience[0]
    topSkills.push({
      id: "1",
      name: exp.title, // Exakter Jobtitel aus CV
      description: exp.description || `Verantwortlich für: ${(exp.responsibilities || []).slice(0, 2).join(", ")}`,
      icon: null,
    })
  }

  // Skill 2: Top 3 Technische Skills (ohne Level-Klammern für Anzeige)
  if ((parsedCV.skills.technical || []).length > 0) {
    const topTechSkills = parsedCV.skills.technical
      .slice(0, 3)
      .map(s => s.replace(/\s*\(.+?\)$/, '')) // Entferne Level für Anzeige
      .join(", ")
    
    topSkills.push({
      id: "2",
      name: "Technische Expertise",
      description: `Umfassende Kenntnisse in ${topTechSkills} mit nachgewiesener Projekterfahrung und ${parsedCV.experienceYears} praktischer Anwendung.`,
      icon: null,
    })
  }

  // Skill 3: Weitere Position oder Zertifikate
  if ((parsedCV.certifications || []).length > 0) {
    const certText = parsedCV.certifications.slice(0, 2).join(", ")
    topSkills.push({
      id: "3",
      name: "Zertifizierungen & Qualifikationen",
      description: `Zertifizierte Expertise: ${certText}. Kontinuierliche Weiterbildung in aktuellen Technologien und Methoden.`,
      icon: null,
    })
  } else if ((parsedCV.experience || [])[1]) {
    const exp = parsedCV.experience[1]
    topSkills.push({
      id: "3",
      name: exp.title,
      description: exp.description || `${exp.company}: ${(exp.responsibilities || []).slice(0, 1).join("")}`,
      icon: null,
    })
  }

  // Skill 4: Projekte oder Ausbildung
  if (parsedCV.projects && parsedCV.projects.length > 0) {
    const project = parsedCV.projects[0]
    topSkills.push({
      id: "4",
      name: project.title,
      description: project.description,
      icon: null,
    })
  } else if ((parsedCV.education || [])[0]) {
    const edu = parsedCV.education[0]
    topSkills.push({
      id: "4",
      name: edu.degree,
      description: `Akademischer Hintergrund: ${edu.degree} an ${edu.institution} (${edu.dateRange})`,
      icon: null,
    })
  }

  return topSkills.slice(0, 4).filter(s => s.name && s.description)
}
