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
    location?: string
  },
): CandidateProfileData {
  // Generiere Initialen
  const name = parsedCV.personalInfo?.name || formData.contactPerson || "N/A"
  const nameParts = name.split(" ").filter(p => p && p.length > 0)
  const initials = nameParts.length > 0 
    ? nameParts.map((part) => part[0]?.toUpperCase() || "").filter(i => i).join(".") 
    : "N.A"

  // Generiere Profil-Zusammenfassung (3 Absätze) - nutze tatsächliche CV-Daten
  const latestRole = parsedCV.experience?.[0]?.title || formData.position
  const topSkillsText = (parsedCV.skills?.technical || [])
    .slice(0, 5)
    .map(s => s.replace(/\s*\(.+?\)$/, '')) // Entferne Level-Klammern
    .filter(s => s.length > 0)
    .join(", ")
  
  // Prüfe ob wir echte CV-Daten haben
  const hasRealData = (parsedCV.experience || []).length > 0 || (parsedCV.skills?.technical || []).length > 0
  
  // Positionszentrierte Zusammenfassung
  const profileSummary = hasRealData ? [
    // Absatz 1: Rolle + Erfahrung + CV-Summary
    (() => {
      let p1 = `${latestRole}`
      if (parsedCV.experienceYears && parsedCV.experienceYears.length > 0) {
        p1 += ` mit ${parsedCV.experienceYears} einschlägiger Berufserfahrung`
      }
      if (parsedCV.summary && parsedCV.summary.length > 0) {
        p1 += `. ${parsedCV.summary}`
      }
      return p1
    })(),
    
    // Absatz 2: Aktuelle Arbeit + Top Skills
    (() => {
      let p2 = ""
      if (parsedCV.experience?.[0]) {
        p2 = `Aktuell tätig als ${parsedCV.experience[0].title} bei ${parsedCV.experience[0].company}.`
        if (parsedCV.experience[0].description) {
          p2 += ` ${parsedCV.experience[0].description}`
        }
      } else {
        p2 = `Expertise in verschiedenen Branchen und Projekten.`
      }
      
      if (topSkillsText.length > 0) {
        p2 += ` Schwerpunkte: ${topSkillsText}.`
      }
      return p2
    })(),
    
    // Absatz 3: Soft Skills + Arbeitsweise
    (() => {
      const softSkills = (parsedCV.skills?.soft || []).join(", ")
      if (softSkills.length > 0) {
        return `Arbeitsweise geprägt durch: ${softSkills}. Fokus auf nachhaltige Ergebnisse und erfolgreiche Zusammenarbeit mit allen Stakeholdern.`
      }
      return `Strukturierte und zielorientierte Arbeitsweise mit Fokus auf nachhaltige Ergebnisse und erfolgreiche Zusammenarbeit.`
    })(),
  ] : [
    `${formData.position} mit fundierter Qualifikation und praktischer Erfahrung im Fachgebiet.`,
    `Motiviert für neue Herausforderungen mit Fokus auf kontinuierliche Weiterentwicklung und Qualität.`,
    `Zuverlässige und engagierte Arbeitsweise mit ausgeprägter Team- und Kundenorientierung.`,
  ]
  
  console.log('📊 Profile Summary generiert:', profileSummary.length, 'Absätze')
  console.log('📊 Summary Details:', { 
    hasSummaryText: !!parsedCV.summary,
    experienceCount: (parsedCV.experience || []).length,
    skillsCount: (parsedCV.skills?.technical || []).length,
    softSkillsCount: (parsedCV.skills?.soft || []).length
  })

  // Generiere Top Skills (max 4)
  const topSkills = generateTopSkills(parsedCV)

  // Generiere Qualifikationen - zeige ALLE wichtigen Aspekte
  const qualifications = [
    // ALLE Zertifikate (wichtigste Credentials)
    ...(parsedCV.certifications || [])
      .filter(c => c && c !== "null" && c.length > 0),
    // Berufserfahrung
    (() => {
      const years = parsedCV.experienceYears && parsedCV.experienceYears !== "null" 
        ? parsedCV.experienceYears 
        : "Mehrjährige"
      return `${years} praktische Berufserfahrung`
    })(),
    // ALLE Bildungsabschlüsse
    ...((parsedCV.education || [])
      .filter(edu => edu && edu.degree && edu.degree !== "null")
      .map((edu) => {
        const degree = edu.degree !== "null" ? edu.degree : ""
        const institution = edu.institution && edu.institution !== "null" ? edu.institution : ""
        if (!degree) return null
        return institution ? `${degree}, ${institution}` : degree
      })
      .filter(q => q !== null)),
    // Top 5 Technical Skills (ohne Level-Klammern)
    ...((parsedCV.skills.technical || [])
      .slice(0, 5)
      .filter(skill => skill && skill !== "null")
      .map((skill) => {
        const cleanSkill = skill.replace(/\s*\(.+?\)$/, '')
        return cleanSkill ? `Expertise in ${cleanSkill}` : null
      })
      .filter(q => q !== null)
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
    { label: "Gehaltsvorstellung", value: formData.salary || "Verhandlungsbereit" },
    { 
      label: "Standort", 
      value: (() => {
        const location = parsedCV.personalInfo?.location || formData.location
        return location && location !== "null" && location !== "undefined" ? location : "-"
      })()
    },
    { label: "Arbeitsmodell", value: "Vollzeit (Hybrid/Remote möglich)" },
    { 
      label: "Aktuelle Position", 
      value: currentPosition && currentPosition !== "null" ? currentPosition : formData.position 
    },
    {
      label: "Berufserfahrung",
      value: (parsedCV.experience || []).length > 0
        ? `${parsedCV.experienceYears || "Mehrjährige"} in ${(parsedCV.experience || []).length} Position${(parsedCV.experience || []).length !== 1 ? 'en' : ''}`
        : parsedCV.experienceYears || "-",
    },
    {
      label: "Kernkompetenzen",
      value: topTechnologies && topTechnologies.length > 0 && topTechnologies !== "Technologien" ? topTechnologies : "-",
    },
    {
      label: "Sprachkenntnisse",
      value: (parsedCV.skills?.languages || []).length > 0
        ? (parsedCV.skills.languages || [])
            .filter(l => l.language && l.language !== "null")
            .map((l) => `${l.language} (${l.level || "Kenntnisse"})`)
            .join(", ") || "-"
        : "-",
    },
  ]
  
  console.log('📋 Personal Details generiert:', personalDetails.length, 'Felder')

  // Generiere IT Skills - nutze Level aus Parsing wenn vorhanden
  const itSkills = (parsedCV.skills?.technical || [])
    .filter(skill => skill && skill.trim().length > 0)
    .map((skill, index) => {
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
        skill: skill.trim(),
        level: index < 3 ? "Expertenkenntnisse" : index < 6 ? "Sehr gute Kenntnisse" : "Gute Kenntnisse",
      }
    })
  
  console.log('💻 IT Skills generiert:', itSkills.length)

  // Languages
  const languages = (parsedCV.skills?.languages || [])
    .filter(l => l && l.language)
    .map((l) => ({
      lang: l.language,
      level: l.level,
    }))
  
  console.log('🌐 Sprachen generiert:', languages.length)

  // Education - kombiniere ALLE Bildungseinträge und Zertifikate
  const education = [
    ...((parsedCV.education || [])
      .filter(edu => edu && edu.degree && edu.degree !== "null")
      .map((edu) => {
        const degree = edu.degree !== "null" ? edu.degree : ""
        const institution = edu.institution && edu.institution !== "null" ? edu.institution : ""
        const dateRange = edu.dateRange && edu.dateRange !== "null" ? edu.dateRange : ""
        
        if (!degree && !institution) return null
        
        let result = degree
        if (institution) result += result ? `, ${institution}` : institution
        if (dateRange) result += ` (${dateRange})`
        
        return result
      })
      .filter(e => e !== null)),
    ...((parsedCV.certifications || [])
      .filter(c => c && c.length > 0 && c !== "null")),
  ].filter(e => e && e.length > 0)
  
  console.log('🎓 Education generiert:', education.length, 'Einträge')

  // Key Projects (aus ALLEN Experience Einträgen)
  const keyProjects = (parsedCV.experience || [])
    .filter(exp => exp && exp.title && exp.company && exp.title !== "null" && exp.company !== "null")
    .map((exp, index) => {
      const responsibilities = (exp.responsibilities || [])
        .filter(r => r && r.length > 0 && r !== "null")
        .slice(0, 3)
      
      const cleanTitle = exp.title !== "null" ? exp.title : "Position"
      const cleanCompany = exp.company !== "null" ? exp.company : "Unternehmen"
      
      return {
        id: `p${index + 1}`,
        title: `${cleanTitle} bei ${cleanCompany}`,
        category: index === 0 ? "Aktuelle Position" : "Frühere Position",
        description: exp.description && exp.description.length > 0 && exp.description !== "null"
          ? exp.description 
          : (responsibilities.length > 0 ? responsibilities[0] : `${cleanTitle}-Tätigkeit`),
        tags: responsibilities.length > 0 
          ? responsibilities 
          : [cleanTitle],
        scope: `${exp.dateRange && exp.dateRange !== "null" ? exp.dateRange : "Zeitraum nicht angegeben"}`,
        icon: null,
      }
    })
  
  console.log('🚀 Key Projects generiert:', keyProjects.length, 'Einträge (ALLE Berufsetappen)')

  // Experience Timeline (ALLE Berufsetappen)
  const experienceTimeline = (parsedCV.experience || [])
    .filter(exp => exp && exp.title && exp.company && exp.title !== "null" && exp.company !== "null")
    .map((exp, index) => {
      const cleanTitle = exp.title !== "null" ? exp.title : "Position"
      const cleanCompany = exp.company !== "null" ? exp.company : "Unternehmen"
      const responsibilities = (exp.responsibilities || [])
        .filter(r => r && r.length > 0 && r !== "null")
      
      return {
        id: `exp_${index}`,
        dateRange: exp.dateRange && exp.dateRange !== "null" ? exp.dateRange : 'Zeitraum nicht angegeben',
        title: `${cleanTitle}, ${cleanCompany}`,
        description: responsibilities.length > 0 
          ? responsibilities.slice(0, 3).join(' • ') 
          : (exp.description && exp.description !== "null" ? exp.description : `${cleanTitle}-Aufgaben`),
      }
    })
  
  console.log('⏱️ Experience Timeline generiert:', experienceTimeline.length)

  // Career Goals - positionszentriert, branchenunabhängig, basierend auf tatsächlicher Rolle
  const currentRole = parsedCV.experience?.[0]?.title || formData.position
  const topTwoSkills = (parsedCV.skills?.technical || [])
    .slice(0, 2)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .filter(s => s.length > 0)
    .join(" und ")
  
  // Intelligente Career Progression basierend auf aktueller Rolle
  let advancedRole = currentRole
  if (currentRole.includes('Junior')) {
    advancedRole = currentRole.replace('Junior', '').trim() || currentRole
  } else if (!currentRole.includes('Senior') && !currentRole.includes('Lead') && !currentRole.includes('Head')) {
    advancedRole = `Senior ${currentRole}`
  } else if (currentRole.includes('Senior')) {
    advancedRole = `Lead ${currentRole.replace('Senior', '').trim()}`
  } else {
    advancedRole = `Expert ${currentRole}`
  }
  
  const careerGoals = [
    {
      title: advancedRole,
      description: `Weiterentwicklung zur nächsten Karrierestufe mit vertiefter Fachexpertise, strategischer Verantwortung und Führung anspruchsvoller Projekte.`,
      icon: null,
    },
    {
      title: "Führungsverantwortung",
      description: `Übernahme von Team- oder Bereichsleitung mit Fokus auf Mitarbeiterentwicklung, strategische Planung und Verantwortung für Geschäftsergebnisse.`,
      icon: null,
    },
    {
      title: "Fachliche Spezialisierung",
      description: topTwoSkills 
        ? `Vertiefung der Expertise in ${topTwoSkills} als anerkannte/r Spezialist/in und Thought Leader im Fachgebiet.`
        : "Aufbau als anerkannte/r Expert/in und Spezialist/in im jeweiligen Fachbereich mit Vortrags- und Beratungstätigkeit.",
      icon: null,
    },
  ]

  // Interests (aus Skills + Soft Skills) - branchenunabhängig
  const fachInterests = (parsedCV.skills?.technical || [])
    .slice(0, 3)
    .map((skill) => ({
      name: skill.replace(/\s*\(.+?\)$/, ''), // Entferne Level-Info
      icon: null,
    }))
  
  const softInterests = (parsedCV.skills?.soft || [])
    .slice(0, 2)
    .map((skill) => ({
      name: skill,
      icon: null,
    }))
  
  const interests = [...fachInterests, ...softInterests].slice(0, 5)

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

  // Motivation Factors - positionszentriert und branchenunabhängig
  const topTwoSkillsClean = (parsedCV.skills?.technical || [])
    .slice(0, 2)
    .map(s => s.replace(/\s*\(.+?\)$/, ''))
    .filter(s => s.length > 0)
    .join(" und ")
  
  // Intelligente Motivation basierend auf Branche/Position
  const position = (parsedCV.experience?.[0]?.title || formData.position).toLowerCase()
  let primaryMotivation = topTwoSkillsClean 
    ? `Arbeit mit ${topTwoSkillsClean} und Weiterentwicklung der fachlichen Expertise`
    : "Anwendung und Vertiefung der fachlichen Kompetenzen"
  
  let secondaryMotivation = "Entwicklung nachhaltiger Lösungen und Optimierung von Prozessen"
  if (position.includes('manager') || position.includes('leiter') || position.includes('lead')) {
    secondaryMotivation = "Führung und Entwicklung von Teams sowie strategische Projektverantwortung"
  } else if (position.includes('berater') || position.includes('consultant')) {
    secondaryMotivation = "Beratung von Kunden und Implementierung erfolgreicher Lösungen"
  }
  
  const motivationFactors = [
    primaryMotivation,
    secondaryMotivation,
    "Kontinuierliche berufliche Weiterentwicklung und Erweiterung des Kompetenzprofils",
    "Erfolgreiche Zusammenarbeit in professionellen Teams und mit verschiedenen Stakeholdern",
  ].filter(m => m && m.length > 0)

  // Verwende die aktuellste Rolle aus dem CV, falls vorhanden, sonst Formular-Input
  const profileTitle = parsedCV.experience?.[0]?.title || formData.position

  const finalProfile = {
    title: profileTitle,
    salaryExpectation: formData.salary || "Verhandlungsbereit",
    availability: `Verfügbar in ${formData.availability}`,
    location: parsedCV.personalInfo?.location || formData.location || "Standort nicht angegeben",
    experienceYears: parsedCV.experienceYears || "< 1 Jahr",
    initials: initials || "N/A",
    contactPerson: {
      name: `Herr ${formData.contactPerson}`,
      phone: formData.contactPhone,
      email: formData.contactEmail,
      website: "www.getexperts.io",
    },
    profileSummary: profileSummary || [],
    topSkills: topSkills || [],
    qualifications: qualifications || [],
    personalDetails: personalDetails || [],
    itSkills: itSkills || [],
    languages: languages || [],
    education: education || [],
    keyProjects: keyProjects || [],
    experienceTimeline: experienceTimeline || [],
    careerGoals: careerGoals || [],
    interests: interests || [],
    personalityTraits: personalityTraits || [],
    motivationFactors: motivationFactors || [],
  }
  
  console.log('✅ Finales Profil zusammengestellt mit:', {
    profileSummary: finalProfile.profileSummary.length,
    topSkills: finalProfile.topSkills.length,
    itSkills: finalProfile.itSkills.length,
    education: finalProfile.education.length,
    experienceTimeline: finalProfile.experienceTimeline.length,
  })
  
  return finalProfile
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

  console.log('🔍 Generiere Top Skills aus:', {
    experienceCount: (parsedCV.experience || []).length,
    techSkillsCount: (parsedCV.skills?.technical || []).length,
    certsCount: (parsedCV.certifications || []).length,
  })

  // Skill 1: Aktuelle/Letzte Position (mit exaktem Jobtitel)
  if ((parsedCV.experience || []).length > 0 && parsedCV.experience[0]) {
    const exp = parsedCV.experience[0]
    const desc = exp.description || 
                 (exp.responsibilities && exp.responsibilities.length > 0 
                   ? `Verantwortlich für: ${exp.responsibilities.slice(0, 2).join(", ")}`
                   : `Tätigkeit bei ${exp.company}`)
    
    topSkills.push({
      id: "1",
      name: exp.title || 'Position', // Exakter Jobtitel aus CV
      description: desc,
      icon: null,
    })
  }

  // Skill 2: Top 3-4 Fachkompetenzen (branchenunabhängig)
  if ((parsedCV.skills?.technical || []).length > 0) {
    const topFachSkills = (parsedCV.skills.technical || [])
      .slice(0, 4)
      .map(s => s.replace(/\s*\(.+?\)$/, '')) // Entferne Level für Anzeige
      .filter(s => s.length > 0)
      .join(", ")
    
    if (topFachSkills) {
      topSkills.push({
        id: "2",
        name: "Fachliche Expertise",
        description: `Fundierte Kenntnisse in ${topFachSkills} mit nachgewiesener Praxiserfahrung aus ${parsedCV.experienceYears} erfolgreicher beruflicher Tätigkeit.`,
        icon: null,
      })
    }
  }

  // Skill 3: Weitere Position oder Zertifikate
  if ((parsedCV.certifications || []).length > 0) {
    const certText = parsedCV.certifications.slice(0, 2).join(", ")
    if (certText) {
      topSkills.push({
        id: "3",
        name: "Zertifizierungen & Qualifikationen",
        description: `Zertifizierte Expertise: ${certText}. Kontinuierliche Weiterbildung in aktuellen Technologien und Methoden.`,
        icon: null,
      })
    }
  } else if ((parsedCV.experience || []).length > 1 && parsedCV.experience[1]) {
    const exp = parsedCV.experience[1]
    const desc = exp.description || 
                 (exp.responsibilities && exp.responsibilities.length > 0
                   ? exp.responsibilities.slice(0, 1).join("")
                   : `Tätigkeit bei ${exp.company}`)
    
    topSkills.push({
      id: "3",
      name: exp.title || 'Weitere Position',
      description: desc,
      icon: null,
    })
  }

  // Skill 4: Projekte oder Ausbildung
  if (parsedCV.projects && parsedCV.projects.length > 0) {
    const project = parsedCV.projects[0]
    if (project.title && project.description) {
      topSkills.push({
        id: "4",
        name: project.title,
        description: project.description,
        icon: null,
      })
    }
  } else if ((parsedCV.education || []).length > 0 && parsedCV.education[0]) {
    const edu = parsedCV.education[0]
    if (edu.degree) {
      topSkills.push({
        id: "4",
        name: edu.degree,
        description: `Akademischer Hintergrund: ${edu.degree} an ${edu.institution} (${edu.dateRange})`,
        icon: null,
      })
    }
  }

  console.log('✅ Top Skills generiert:', topSkills.length)
  return topSkills.filter(s => s.name && s.name.length > 0 && s.description && s.description.length > 0)
}
