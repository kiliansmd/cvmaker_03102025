"use client"

import CandidateProfileDisplay from "@/components/candidate-profile-display"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DemoPage() {
  const router = useRouter()

  const demoProfileData = {
    title: "Senior SAP HCM Berater",
    salaryExpectation: "90.000 € / Jahr",
    availability: "Verfügbar in 1 Monat",
    location: "Frankfurt am Main",
    experienceYears: "8+ Jahre",
    initials: "M.M.",
    contactPerson: {
      name: "Herr Marius Kau",
      phone: "+49 15888 648781",
      email: "marius.kau@getexperts.io",
      website: "www.getexperts.io",
    },
    profileSummary: [
      "Erfahrener Senior SAP HCM Berater mit 8+ Jahren umfassender Expertise. Spezialisiert auf HR-Prozessoptimierung, Organisationsmanagement und Zeitwirtschaft mit nachweislichen Erfolgen in komplexen SAP-Transformationsprojekten.",
      "Ausgewiesener Experte mit praktischer Erfahrung in SAP SuccessFactors, SAP HCM, Workday und weiteren führenden HR-Technologien. Umfassende Kenntnisse bei Siemens AG, Deutsche Bank und anderen DAX-Konzernen mit Fokus auf technische Exzellenz.",
      "Zuverlässiger Spezialist mit akademischem Hintergrund (Master in Wirtschaftsinformatik, TU München) und über 8 Jahren praktischer Erfahrung. Expertise in strategischer Planung und der kontinuierlichen Optimierung komplexer HR-Systeme.",
    ],
    topSkills: [
      {
        id: "1",
        name: "SAP HCM Implementierung & Customizing",
        description:
          "Umfassende Expertise in End-to-End SAP HCM Implementierungen, Modul-Konfiguration (PA, OM, PT, PY) und Business Process Optimization für Großkonzerne.",
        icon: null,
      },
      {
        id: "2",
        name: "SAP SuccessFactors, Workday, Personio",
        description:
          "Umfassende Expertise in SAP SuccessFactors, Workday, Personio mit praktischer Erfahrung in komplexen Cloud-HR-Migrationsprojekten.",
        icon: null,
      },
      {
        id: "3",
        name: "HR Process Consulting & Projektmanagement",
        description:
          "Strategische HR-Prozessberatung, Change Management und agile Projektführung mit Schwerpunkt auf Stakeholder-Kommunikation und Time-to-Value Optimierung.",
        icon: null,
      },
      {
        id: "4",
        name: "SAP Certified Application Associate - SAP HCM",
        description:
          "Zertifizierte Expertise mit SAP Certified Application Associate und kontinuierlicher Weiterbildung in Cloud HR Solutions.",
        icon: null,
      },
    ],
    qualifications: [
      "SAP Certified Application Associate - SAP HCM",
      "Scrum Master Zertifizierung (PSM I)",
      "ITIL Foundation Certificate",
      "8+ Jahre praktische Berufserfahrung",
      "Master in Wirtschaftsinformatik, Technische Universität München",
      "Bachelor in Betriebswirtschaft, Ludwig-Maximilians-Universität München",
      "Expertise in SAP SuccessFactors",
      "Expertise in Workday",
      "Expertise in Personio",
    ],
    personalDetails: [
      { label: "Verfügbarkeit", value: "Verfügbar in 1 Monat" },
      { label: "Gehaltsvorstellung", value: "90.000 € / Jahr" },
      { label: "Standort", value: "Frankfurt am Main" },
      { label: "Arbeitsmodell", value: "Vollzeit (Hybrid/Remote möglich)" },
      { label: "Zielposition", value: "Senior SAP HCM Berater" },
      {
        label: "Besonderheit",
        value: "8+ Jahre + SAP Certified + SAP SuccessFactors",
      },
      {
        label: "Sprachkenntnisse",
        value: "Deutsch (Muttersprache), Englisch (Verhandlungssicher C1), Spanisch (Grundkenntnisse A2)",
      },
    ],
    itSkills: [
      { skill: "SAP SuccessFactors", level: "Expertenkenntnisse" },
      { skill: "SAP HCM (PA, OM, PT, PY)", level: "Expertenkenntnisse" },
      { skill: "Workday", level: "Expertenkenntnisse" },
      { skill: "Personio", level: "Sehr gute Kenntnisse" },
      { skill: "SAP Fiori", level: "Sehr gute Kenntnisse" },
      { skill: "ABAP/4", level: "Sehr gute Kenntnisse" },
      { skill: "SQL", level: "Gute Kenntnisse" },
      { skill: "Jira / Confluence", level: "Gute Kenntnisse" },
    ],
    languages: [
      { lang: "Deutsch", level: "Muttersprache" },
      { lang: "Englisch", level: "Verhandlungssicher (C1)" },
      { lang: "Spanisch", level: "Grundkenntnisse (A2)" },
    ],
    education: [
      "Master in Wirtschaftsinformatik, Technische Universität München (2014 - 2016)",
      "Bachelor in Betriebswirtschaft, Ludwig-Maximilians-Universität München (2011 - 2014)",
      "SAP Certified Application Associate - SAP HCM",
      "Scrum Master Zertifizierung (PSM I)",
      "ITIL Foundation Certificate",
    ],
    keyProjects: [
      {
        id: "p1",
        title: "Senior SAP HCM Consultant bei Siemens AG",
        category: "Aktuelle Position",
        description:
          "Leitung der SAP SuccessFactors Employee Central Implementierung für 15.000+ Mitarbeiter. Verantwortlich für Requirements Engineering, Solution Design und Go-Live Koordination.",
        tags: [
          "SAP SuccessFactors EC Implementation",
          "Change Management für 15.000+ User",
          "Integration mit Payroll & Time Management",
          "Stakeholder Management C-Level",
        ],
        scope: "Erfolgreiche Senior SAP HCM Consultant-Tätigkeit bei Siemens AG.",
        icon: null,
      },
      {
        id: "p2",
        title: "SAP HCM Berater bei Deutsche Bank AG",
        category: "Berufserfahrung",
        description:
          "Customizing und Optimierung der SAP HCM Module (PA, OM, PT, PY) für 25.000+ Mitarbeiter. Durchführung von Workshops, Schulungen und Process Reengineering.",
        tags: [
          "SAP HCM Customizing (PA/OM/PT/PY)",
          "HR Process Optimization",
          "Reporting & Analytics (SAP Query, InfoSets)",
          "User Training & Documentation",
        ],
        scope: "Erfolgreiche SAP HCM Berater-Tätigkeit bei Deutsche Bank AG.",
        icon: null,
      },
      {
        id: "p3",
        title: "Junior SAP Consultant bei Accenture",
        category: "Berufserfahrung",
        description:
          "Unterstützung bei SAP HCM Rollouts, Datenmigrationen und System-Testing. Eigenständige Durchführung von Requirement Workshops und Erstellung technischer Spezifikationen.",
        tags: [
          "SAP HCM Rollout Support",
          "Data Migration (Legacy → SAP)",
          "Test Case Development & UAT",
          "Technical Documentation",
        ],
        scope: "Erfolgreiche Junior SAP Consultant-Tätigkeit bei Accenture.",
        icon: null,
      },
    ],
    experienceTimeline: [
      {
        id: "exp_0",
        dateRange: "2020 - Heute",
        title: "Senior SAP HCM Consultant, Siemens AG",
        description:
          "Leitung der SAP SuccessFactors Employee Central Implementierung für 15.000+ Mitarbeiter. Verantwortlich für Requirements Engineering, Solution Design und Go-Live Koordination.",
      },
      {
        id: "exp_1",
        dateRange: "2017 - 2020",
        title: "SAP HCM Berater, Deutsche Bank AG",
        description:
          "Customizing und Optimierung der SAP HCM Module (PA, OM, PT, PY) für 25.000+ Mitarbeiter. Durchführung von Workshops, Schulungen und Process Reengineering.",
      },
      {
        id: "exp_2",
        dateRange: "2016 - 2017",
        title: "Junior SAP Consultant, Accenture",
        description:
          "Unterstützung bei SAP HCM Rollouts, Datenmigrationen und System-Testing. Eigenständige Durchführung von Requirement Workshops und Erstellung technischer Spezifikationen.",
      },
    ],
    careerGoals: [
      {
        title: "Senior Senior SAP HCM Berater",
        description:
          "Weiterentwicklung zum Senior Senior SAP HCM Berater mit strategischer Verantwortung für komplexe Projekte und technische Führung.",
        icon: null,
      },
      {
        title: "Teamleitung / Management",
        description:
          "Aufbau zur Teamleitung oder Management-Position mit Fokus auf Mitarbeiterentwicklung und strategische Planung.",
        icon: null,
      },
      {
        title: "Spezialisierung",
        description:
          "Vertiefung der Expertise in SAP SuccessFactors und Workday für spezialisierte Beratungsdienstleistungen.",
        icon: null,
      },
    ],
    interests: [
      { name: "SAP SuccessFactors", icon: null },
      { name: "Workday", icon: null },
      { name: "Personio", icon: null },
      { name: "SAP Fiori", icon: null },
    ],
    personalityTraits: [
      "8+ Jahre Berufserfahrung mit kontinuierlicher Weiterentwicklung",
      "Master in Wirtschaftsinformatik",
      "SAP Certified Application Associate - SAP HCM",
      "Scrum Master Zertifizierung (PSM I)",
      "Expertise in SAP SuccessFactors, Workday, Personio",
      "Analytisches Denken",
      "Kommunikationsstärke",
    ],
    motivationFactors: [
      "Arbeit mit SAP SuccessFactors und Workday",
      "Entwicklung und Optimierung komplexer HR-Systeme",
      "Kontinuierliche Weiterbildung in zukunftsweisenden Cloud-HR-Technologien",
      "Zusammenarbeit in interdisziplinären Teams",
    ],
  }

  return (
    <div>
      <div className="fixed top-4 left-4 z-50 no-print">
        <Button onClick={() => router.push("/")} variant="outline" className="bg-white shadow-lg">
          ← Zurück zum Upload
        </Button>
      </div>
      <CandidateProfileDisplay profileData={demoProfileData} />
    </div>
  )
}

