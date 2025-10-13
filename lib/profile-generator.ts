import type { ParsedCV } from "./cv-parser"
import {
  Database,
  FileText,
  Settings,
  Users,
  Server,
  Monitor,
  Cloud,
  Shield,
  Target,
  Building,
  Award,
  Globe,
} from "lucide-react"

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

const iconMap: { [key: string]: any } = {
  Database,
  FileText,
  Settings,
  Users,
  Server,
  Monitor,
  Cloud,
  Shield,
  Target,
  Building,
  Award,
  Globe,
}

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
    `Erfahrene/r ${formData.position} mit ${parsedCV.experienceYears} umfassender Expertise. ${parsedCV.summary}`,
    `Ausgewiesene/r Experte/Expertin mit praktischer Erfahrung in ${
      (parsedCV.skills.technical || []).slice(0, 3).join(", ") || "relevanten Technologien"
    } und weiteren Technologien. Umfassende Kenntnisse in ${
      parsedCV.experience?.[0]?.company || "führenden Unternehmen"
    } mit Fokus auf ${parsedCV.experience?.[0]?.title || "technische Exzellenz"}.`,
    `Zuverlässige/r Spezialist/in mit akademischem Hintergrund (${parsedCV.education?.[0]?.degree || "Hochschulabschluss"}) und über ${
      parsedCV.experienceYears || "mehrere Jahre"
    } praktischer Erfahrung. Expertise in strategischer Planung und der kontinuierlichen Optimierung komplexer Systeme.`,
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
    icon: iconMap[index % 2 === 0 ? "Server" : "Database"],
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
      icon: iconMap.Target,
    },
    {
      title: "Teamleitung / Management",
      description: `Aufbau zur Teamleitung oder Management-Position mit Fokus auf Mitarbeiterentwicklung und strategische Planung.`,
      icon: iconMap.Users,
    },
    {
      title: "Spezialisierung",
      description: `Vertiefung der Expertise in ${(parsedCV.skills.technical || []).slice(0, 2).join(" und ")} für spezialisierte Beratungsdienstleistungen.`,
      icon: iconMap.Building,
    },
  ]

  // Interests (aus Skills)
  const interests = (parsedCV.skills.technical || []).slice(0, 4).map((skill, index) => ({
    name: skill,
    icon: iconMap[["Cloud", "Shield", "Award", "Globe"][index % 4]],
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
      icon: iconMap.Server,
    })
  }

  // Skill 2: Technische Skills
  if ((parsedCV.skills.technical || []).length > 0) {
    topSkills.push({
      id: "2",
      name: parsedCV.skills.technical.slice(0, 3).join(", "),
      description: `Umfassende Expertise in ${parsedCV.skills.technical.slice(0, 3).join(", ")} mit praktischer Erfahrung in komplexen Projekten.`,
      icon: iconMap.Database,
    })
  }

  // Skill 3: Aus Projekten oder Experience
  if ((parsedCV.experience || [])[1]) {
    topSkills.push({
      id: "3",
      name: `${parsedCV.experience[1].title} & Projektmanagement`,
      description: parsedCV.experience[1].description,
      icon: iconMap.Settings,
    })
  }

  // Skill 4: Soft Skills / Zertifizierungen
  if ((parsedCV.certifications || []).length > 0) {
    topSkills.push({
      id: "4",
      name: parsedCV.certifications[0],
      description: `Zertifizierte Expertise mit ${parsedCV.certifications[0]} und kontinuierlicher Weiterbildung.`,
      icon: iconMap.Award,
    })
  }

  return topSkills.slice(0, 4)
}
