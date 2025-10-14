"use client"
import Image from "next/image"
import { MapPin, Clock, Euro, Phone, Mail, Globe, Check, Briefcase } from "lucide-react"

interface CandidateProfileDisplayProps {
  profileData: any
}

export default function CandidateProfileDisplay({ profileData }: CandidateProfileDisplayProps) {
  const candidateData = profileData

  const hasItems = (arr: any[] | undefined) => arr && arr.length > 0

  return (
    <div className="min-h-screen bg-white font-sans" id="candidate-profile">
      {/* Cover Page */}
      <section className="relative h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[rgb(var(--brand))] to-[rgb(var(--brand-600))] text-center overflow-hidden page-break-after">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/interwoven-algorithms.png')] bg-no-repeat bg-cover"></div>
        </div>

        <div className="absolute top-8 left-8 z-10">
          <Image src="/getexperts-logo.png" alt="getexperts Logo" width={240} height={80} className="mb-8" />
        </div>

        {/* Initials in top right corner */}
        <div className="absolute top-8 right-8 z-10">
          <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-white font-bold text-xl">{candidateData.initials}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto z-10">
          <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm">
            Professionelles Kandidatenprofil | getexperts.io
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight">{candidateData.title}</h1>
          {(candidateData.salaryExpectation ||
            candidateData.availability ||
            candidateData.location ||
            candidateData.experienceYears) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
              {candidateData.salaryExpectation && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Euro className="h-6 w-6 text-slate-300" />
                  <span className="text-lg">Gehalt: {candidateData.salaryExpectation}</span>
                </div>
              )}
              {candidateData.availability && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Clock className="h-6 w-6 text-slate-300" />
                  <span className="text-lg">{candidateData.availability}</span>
                </div>
              )}
              {candidateData.location && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <MapPin className="h-6 w-6 text-slate-300" />
                  <span className="text-lg">{candidateData.location}</span>
                </div>
              )}
              {candidateData.experienceYears && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Briefcase className="h-6 w-6 text-slate-300" />
                  <span className="text-lg">Erfahrung: {candidateData.experienceYears}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {candidateData.contactPerson && (
          <div className="absolute bottom-8 left-0 right-0 text-center z-10">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Ihr Ansprechpartner</h3>
              <div className="flex flex-col items-center gap-3 text-slate-200">
                {candidateData.contactPerson.name && (
                  <div className="font-semibold text-white">{candidateData.contactPerson.name}</div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  {candidateData.contactPerson.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      <span>{candidateData.contactPerson.phone}</span>
                    </div>
                  )}
                  {candidateData.contactPerson.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      <span>{candidateData.contactPerson.email}</span>
                    </div>
                  )}
                  {candidateData.contactPerson.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <span>{candidateData.contactPerson.website}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Inhalt – Details / Skills / Sprachen */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Details */}
          <div className="ui-card p-6">
            <h2 className="ui-section-title text-xl mb-4">Details</h2>
            <div className="divide-y divide-slate-200 rounded-[var(--radius)] overflow-hidden border border-slate-200">
              {(candidateData.personalDetails || []).map((row: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 md:grid-cols-3 bg-white">
                  <div className="col-span-1 px-4 py-3 text-slate-500">{row.label}</div>
                  <div className="col-span-2 px-4 py-3">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IT-Skills */}
          <div className="ui-card p-6">
            <h2 className="ui-section-title text-xl mb-4">IT‑Skills</h2>
            <div className="divide-y divide-slate-200 rounded-[var(--radius)] overflow-hidden border border-slate-200">
              {(candidateData.itSkills || []).map((s: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 bg-white">
                  <div className="col-span-2 px-4 py-3">{s.skill}</div>
                  <div className="col-span-1 px-4 py-3 ui-muted">{s.level}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sprachen */}
          <div className="ui-card p-6 lg:col-span-2">
            <h2 className="ui-section-title text-xl mb-4">Sprachen</h2>
            <div className="divide-y divide-slate-200 rounded-[var(--radius)] overflow-hidden border border-slate-200">
              {(candidateData.languages || []).map((l: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 bg-white">
                  <div className="col-span-2 px-4 py-3">{l.lang}</div>
                  <div className="col-span-1 px-4 py-3 ui-muted">{l.level}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-8 bg-gradient-to-br from-[#282550] to-[#1a1a38] text-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <Image src="/getexperts-logo.png" alt="getexperts Logo" width={180} height={60} className="mb-4" />
            <p className="text-slate-300 text-sm mb-4">
              Spezialisiert auf die Vermittlung hochqualifizierter Fachkräfte mit professionellen Kandidatenprofilen.
            </p>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>5.000+ Experten im exklusiven Pool</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Kontakt</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Rudolfplatz 3, 50674 Köln</span>
              </div>
              {candidateData.contactPerson?.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{candidateData.contactPerson.phone}</span>
                </div>
              )}
              {candidateData.contactPerson?.email && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{candidateData.contactPerson.email}</span>
                </div>
              )}
              {candidateData.contactPerson?.website && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{candidateData.contactPerson.website}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                <Clock className="h-4 w-4" /> Verfügbarkeit
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Kandidat:</span>
                <span className="text-white font-medium">{candidateData.availability}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                <div className="bg-green-500 h-2 rounded-full w-[95%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} getexperts GmbH. Alle Rechte vorbehalten.
          </div>
          <div className="flex gap-4 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">
              Datenschutz
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Impressum
            </a>
            <a href="#" className="hover:text-white transition-colors">
              AGB
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
