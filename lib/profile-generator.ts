import type { ParsedCV } from "./cv-parser"

export interface CandidateProfileData {
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

  // Generiere Profil-Zusammenfassung (3 Absätze)
  const profileSummary = [
    `${formData.position} mit ${parsedCV.experienceYears} relevanter Erfahrung. ${parsedCV.summary}`,
    `Schwerpunkte: ${(parsedCV.skills.technical || []).slice(0, 3).join(", ") || "moderne Technologien"}. Projektpraxis u. a. bei ${
      parsedCV.experience?.[0]?.company || "führenden Unternehmen"
    } in der Rolle ${parsedCV.experience?.[0]?.title || "Technical Consultant"}.`,
    `Arbeitsweise: analytisch, strukturiert und unternehmerisch. Ziel: messbare Ergebnisse und nachhaltige Lösungen in enger Zusammenarbeit mit Stakeholdern.`,
  ]

  // Generiere Top Skills (max 4)
  const topSkills = generateTopSkills(parsedCV)

  // Generiere Qualifikationen
  const qualifications = [
    ...(parsedCV.certifications || []).slice(0, 3),
    `${parsedCV.experienceYears || "Erfahrung"} praktische Berufserfahrung`,
    ...((parsedCV.education || []).slice(0, 2).map((edu) => `${edu.degree}, ${edu.institution}`)),
    ...((parsedCV.skills.technical || []).slice(0, 3).map((skill) => `Expertise in ${skill}`)),
  ]

  // Generiere Personal Details
  const personalDetails = [
    { label: "Verfügbarkeit", value: `Verfügbar in ${formData.availability}` },
    { label: "Gehaltsvorstellung", value: formData.salary },
    { label: "Standort", value: (parsedCV.personalInfo && parsedCV.personalInfo.location) ? parsedCV.personalInfo.location : "-" },
    { label: "Arbeitsmodell", value: "Vollzeit (Hybrid/Remote möglich)" },
    { label: "Zielposition", value: formData.position },
    {
      label: "Besonderheit",
      value: `${parsedCV.experienceYears || "Erfahrung"} + ${
        (parsedCV.certifications || [])[0] || "Zertifiziert"
      } + ${(parsedCV.skills.technical || [])[0] || "Technologien"}`,
    },
    {
      label: "Sprachkenntnisse",
      value: (parsedCV.skills.languages || []).map((l) => `${l.language} (${l.level})`).join(", "),
    },
  ]

  // Generiere IT Skills mit geschätzten Levels
  const itSkills = (parsedCV.skills.technical || []).map((skill, index) => ({
    skill,
    level: index < 3 ? "Expertenkenntnisse" : index < 6 ? "Sehr gute Kenntnisse" : "Gute Kenntnisse",
  }))

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

  // Career Goals
  const careerGoals = [
    {
      title: `Senior ${formData.position}`,
      description: `Weiterentwicklung zum Senior ${formData.position} mit strategischer Verantwortung für komplexe Projekte und technische Führung.`,
      icon: null,
    },
    {
      title: "Teamleitung / Management",
      description: `Aufbau zur Teamleitung oder Management-Position mit Fokus auf Mitarbeiterentwicklung und strategische Planung.`,
      icon: null,
    },
    {
      title: "Spezialisierung",
      description: `Vertiefung der Expertise in ${(parsedCV.skills.technical || []).slice(0, 2).join(" und ")} für spezialisierte Beratungsdienstleistungen.`,
      icon: null,
    },
  ]

  // Interests (aus Skills)
  const interests = (parsedCV.skills.technical || []).slice(0, 4).map((skill, index) => ({
    name: skill,
    icon: null,
  }))

  // Personality Traits
  const personalityTraits = [
    `${parsedCV.experienceYears || "Erfahrung"} Berufserfahrung mit kontinuierlicher Weiterentwicklung`,
    `${parsedCV.education?.[0]?.degree || "Akademischer Hintergrund"}`,
    ...((parsedCV.certifications || []).slice(0, 2)),
    `Expertise in ${(parsedCV.skills.technical || []).slice(0, 3).join(", ")}`,
    ...((parsedCV.skills.soft || []).slice(0, 2)),
  ]

  // Motivation Factors
  const motivationFactors = [
    `Arbeit mit ${(parsedCV.skills.technical || []).slice(0, 2).join(" und ")}`,
    "Entwicklung und Optimierung komplexer Systeme",
    "Kontinuierliche Weiterbildung in zukunftsweisenden Technologien",
    "Zusammenarbeit in interdisziplinären Teams",
  ]

  return {
    title: formData.position,
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

  // Skill 1: Hauptkompetenz aus Experience
  if ((parsedCV.experience || [])[0]) {
    topSkills.push({
      id: "1",
      name: parsedCV.experience[0].title,
      description: parsedCV.experience[0].description,
      icon: null,
    })
  }

  // Skill 2: Technische Skills
  if ((parsedCV.skills.technical || []).length > 0) {
    topSkills.push({
      id: "2",
      name: parsedCV.skills.technical.slice(0, 3).join(", "),
      description: `Umfassende Expertise in ${parsedCV.skills.technical.slice(0, 3).join(", ")} mit praktischer Erfahrung in komplexen Projekten.`,
      icon: null,
    })
  }

  // Skill 3: Aus Projekten oder Experience
  if ((parsedCV.experience || [])[1]) {
    topSkills.push({
      id: "3",
      name: `${parsedCV.experience[1].title} & Projektmanagement`,
      description: parsedCV.experience[1].description,
      icon: null,
    })
  }

  // Skill 4: Soft Skills / Zertifizierungen
  if ((parsedCV.certifications || []).length > 0) {
    topSkills.push({
      id: "4",
      name: parsedCV.certifications[0],
      description: `Zertifizierte Expertise mit ${parsedCV.certifications[0]} und kontinuierlicher Weiterbildung.`,
      icon: null,
    })
  }

  return topSkills.slice(0, 4)
}
