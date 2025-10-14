"use client"
import Image from "next/image"
import { MapPin, Clock, Euro, Phone, Mail, Globe, Check, Briefcase } from "lucide-react"
import AttachmentPdfViewer from "./attachment-pdf-viewer"
import { useRef, useState } from "react"

interface CandidateProfileDisplayProps {
  profileData: any
  editable?: boolean
  onChange?: (next: any) => void
}

export default function CandidateProfileDisplay({ profileData, editable = false, onChange }: CandidateProfileDisplayProps) {
  const candidateData = profileData
  const sectionRefs = [useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null), useRef<HTMLDivElement|null>(null)]
  const [sectionIndex, setSectionIndex] = useState(0)

  const scrollToRel = (dir: number) => {
    const next = Math.min(Math.max(sectionIndex + dir, 0), sectionRefs.length - 1)
    setSectionIndex(next)
    const el = sectionRefs[next].current
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const moveItem = (arr: any[], from: number, to: number) => {
    const copy = [...arr]
    if (to < 0 || to >= copy.length) return copy
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  }

  const hasItems = (arr: any[] | undefined) => arr && arr.length > 0

  return (
    <div className="min-h-screen bg-white font-sans" id="candidate-profile">
      {/* Cover Page */}
      <section className="relative h-screen flex flex-col items-center justify-center p-8 text-center overflow-hidden page-break-after">
        {/* Dekorativer Hintergrund (mehr Tiefe, dezente Bewegung) */}
        <div className="absolute inset-0">
          {/* Grundverlauf */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand))] to-[rgb(var(--brand-600))]" />
          {/* radial light spots */}
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_60%)] blur-2xl opacity-60" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_60%)] blur-3xl opacity-50" />
          {/* feines Grid */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
          {/* weiche Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.25))]" />
        </div>
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
          <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm ring-1 ring-white/20">
            Professionelles Kandidatenprofil | getexperts.io
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight"
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => editable && onChange?.({ ...candidateData, title: e.currentTarget.textContent })}
          >
            {candidateData.title}
          </h1>
          {(candidateData.salaryExpectation ||
            candidateData.availability ||
            candidateData.location ||
            candidateData.experienceYears) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
              {candidateData.salaryExpectation && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Euro className="h-6 w-6 text-slate-300" />
                  <span
                    className="text-lg"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => editable && onChange?.({ ...candidateData, salaryExpectation: e.currentTarget.textContent })}
                  >
                    Gehalt: {candidateData.salaryExpectation}
                  </span>
                </div>
              )}
              {candidateData.availability && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Clock className="h-6 w-6 text-slate-300" />
                  <span
                    className="text-lg"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => editable && onChange?.({ ...candidateData, availability: e.currentTarget.textContent })}
                  >
                    {candidateData.availability}
                  </span>
                </div>
              )}
              {candidateData.location && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <MapPin className="h-6 w-6 text-slate-300" />
                  <span
                    className="text-lg"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => editable && onChange?.({ ...candidateData, location: e.currentTarget.textContent })}
                  >
                    {candidateData.location}
                  </span>
                </div>
              )}
              {candidateData.experienceYears && (
                <div className="flex items-center gap-3 text-slate-100 backdrop-blur-sm bg-white/10 p-4 rounded-lg shadow-md">
                  <Briefcase className="h-6 w-6 text-slate-300" />
                  <span
                    className="text-lg"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => editable && onChange?.({ ...candidateData, experienceYears: e.currentTarget.textContent })}
                  >
                    Erfahrung: {candidateData.experienceYears}
                  </span>
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
              {/* CTAs */}
              <div className="mt-4 flex items-center justify-center gap-3 no-print">
                <a href="#" onClick={(e)=>{e.preventDefault(); window.print();}} className="px-4 py-2 rounded-[var(--radius)] bg-white/90 text-[rgb(var(--brand))] hover:bg-white ui-focus">Profil als PDF</a>
                {candidateData.contactPerson?.email && (
                  <a href={`mailto:${candidateData.contactPerson.email}`} className="px-4 py-2 rounded-[var(--radius)] border border-white/70 text-white hover:bg-white/10 ui-focus">Kontakt aufnehmen</a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Inhalt – Details / Skills / Sprachen */}
      <section className="py-16 px-6 bg-white">
        {/* Highlights (Konversionsstark) */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="ui-card p-6">
            <h2 className="ui-section-title text-xl mb-4">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Höchster Abschluss */}
              <div>
                <div className="ui-muted text-sm mb-1">Höchster Abschluss</div>
                <div>{(candidateData.education || [])[0] || "–"}</div>
              </div>
              {/* Top Skills */}
              <div>
                <div className="ui-muted text-sm mb-1">Top Skills</div>
                <div className="flex flex-wrap gap-2">
                  {(candidateData.itSkills || []).slice(0,3).map((s: any, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">{s.skill}</span>
                  ))}
                </div>
              </div>
              {/* Top Tools */}
              <div>
                <div className="ui-muted text-sm mb-1">Top Tools</div>
                <div className="flex flex-wrap gap-2">
                  {(candidateData.topSkills || []).slice(0,3).map((t: any, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">{t.name}</span>
                  ))}
                </div>
              </div>
              {/* Zertifikate */}
              <div>
                <div className="ui-muted text-sm mb-1">Zertifikate</div>
                <div className="flex flex-wrap gap-2">
                  {(candidateData.qualifications || []).slice(0,3).map((q: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">{q}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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

          {/* Kernkompetenzen */}
          <div className="ui-card p-6">
            <h2 className="ui-section-title text-xl mb-4">Kernkompetenzen</h2>
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

        {/* Zusammenfassung & Projekte */}
        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Summary */}
          <div className="ui-card p-6">
            <h2 className="ui-section-title text-xl mb-4">Kurzprofil</h2>
            <ul className="list-disc ml-5 space-y-2">
              {(candidateData.profileSummary || []).map((s: string, i: number) => (
                <li
                  key={i}
                  className="leading-relaxed"
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (!editable) return
                    const next = [...(candidateData.profileSummary || [])]
                    next[i] = e.currentTarget.textContent || ''
                    onChange?.({ ...candidateData, profileSummary: next })
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Wichtige Projekte */}
          {Array.isArray(candidateData.keyProjects) && candidateData.keyProjects.length > 0 && (
            <div className="ui-card p-6">
              <h2 className="ui-section-title text-xl mb-4">Schlüsselprojekte</h2>
              <div className="space-y-4">
                {candidateData.keyProjects.slice(0, 4).map((p: any, idx: number) => (
                  <div key={p.id || idx} className="rounded-[var(--radius)] border border-slate-200 p-4">
                    <div
                      className="font-medium"
                      contentEditable={editable}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (!editable) return
                        const next = [...candidateData.keyProjects]
                        next[idx] = { ...p, title: e.currentTarget.textContent }
                        onChange?.({ ...candidateData, keyProjects: next })
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      className="ui-muted text-sm mb-2"
                      contentEditable={editable}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (!editable) return
                        const next = [...candidateData.keyProjects]
                        next[idx] = { ...p, category: e.currentTarget.textContent }
                        onChange?.({ ...candidateData, keyProjects: next })
                      }}
                    >
                      {p.category}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      contentEditable={editable}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (!editable) return
                        const next = [...candidateData.keyProjects]
                        next[idx] = { ...p, description: e.currentTarget.textContent }
                        onChange?.({ ...candidateData, keyProjects: next })
                      }}
                    >
                      {p.description}
                    </p>
                    {Array.isArray(p.tags) && p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.tags.slice(0, 4).map((t: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {editable && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-[var(--radius)] border border-slate-200 hover:bg-slate-50"
                          onClick={() => onChange?.({ ...candidateData, keyProjects: moveItem(candidateData.keyProjects, idx, idx - 1) })}
                        >
                          ↑ Nach oben
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-[var(--radius)] border border-slate-200 hover:bg-slate-50"
                          onClick={() => onChange?.({ ...candidateData, keyProjects: moveItem(candidateData.keyProjects, idx, idx + 1) })}
                        >
                          ↓ Nach unten
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-[var(--radius)] border border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            const next = candidateData.keyProjects.filter((_: any, i: number) => i !== idx)
                            onChange?.({ ...candidateData, keyProjects: next })
                          }}
                        >
                          Entfernen
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Berufsetappen / Timeline */}
        {Array.isArray(candidateData.experienceTimeline) && candidateData.experienceTimeline.length > 0 && (
          <div ref={sectionRefs[3]} className="max-w-6xl mx-auto mt-8">
            <div className="ui-card p-6">
              <h2 className="ui-section-title text-xl mb-4">Berufsetappen</h2>
              <div className="space-y-4">
                {candidateData.experienceTimeline.map((e: any, idx: number) => (
                  <div key={e.id || idx} className="grid grid-cols-12 gap-4">
                    <div
                      className="col-span-12 md:col-span-3 ui-muted text-sm"
                      contentEditable={editable}
                      suppressContentEditableWarning
                      onBlur={(ev) => {
                        if (!editable) return
                        const next = [...candidateData.experienceTimeline]
                        next[idx] = { ...e, dateRange: ev.currentTarget.textContent }
                        onChange?.({ ...candidateData, experienceTimeline: next })
                      }}
                    >
                      {e.dateRange}
                    </div>
                    <div className="col-span-12 md:col-span-9">
                      <div
                        className="font-medium"
                        contentEditable={editable}
                        suppressContentEditableWarning
                        onBlur={(ev) => {
                          if (!editable) return
                          const next = [...candidateData.experienceTimeline]
                          next[idx] = { ...e, title: ev.currentTarget.textContent }
                          onChange?.({ ...candidateData, experienceTimeline: next })
                        }}
                      >
                        {e.title}
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        contentEditable={editable}
                        suppressContentEditableWarning
                        onBlur={(ev) => {
                          if (!editable) return
                          const next = [...candidateData.experienceTimeline]
                          next[idx] = { ...e, description: ev.currentTarget.textContent }
                          onChange?.({ ...candidateData, experienceTimeline: next })
                        }}
                      >
                        {e.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {editable && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded-[var(--radius)] border border-slate-200 hover:bg-slate-50"
                    onClick={() => onChange?.({ ...candidateData, experienceTimeline: [...candidateData.experienceTimeline, { id: `exp_${Date.now()}`, dateRange: '', title: '', description: '' }] })}
                  >
                    + Etappe hinzufügen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ausbildung */}
        {Array.isArray(candidateData.education) && candidateData.education.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="ui-card p-6">
              <h2 className="ui-section-title text-xl mb-4">Ausbildung</h2>
              <ul className="space-y-2">
                {candidateData.education.map((ed: string, idx: number) => (
                  <li
                    key={idx}
                    className="leading-relaxed"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (!editable) return
                      const next = [...candidateData.education]
                      next[idx] = e.currentTarget.textContent || ''
                      onChange?.({ ...candidateData, education: next })
                    }}
                  >
                    {ed}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Anhänge */}
        {Array.isArray(candidateData.attachments) && candidateData.attachments.length > 0 && (
          <div ref={sectionRefs[7]} className="max-w-6xl mx-auto mt-8">
            <div className="ui-card p-6">
              <h2 className="ui-section-title text-xl mb-4">Anhänge</h2>
              <div className="space-y-6">
                {candidateData.attachments.map((f: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium truncate">{f.name}</div>
                      <div className="ui-muted text-sm">{f.type || 'Datei'} • {(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                    {f.type?.includes('pdf') && f.url ? (
                      <AttachmentPdfViewer src={f.url} />
                    ) : (
                      f.url && (
                        <a href={f.url} download className="px-3 py-2 rounded-[var(--radius)] border border-slate-200 text-sm hover:bg-slate-50 ui-focus">Herunterladen</a>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
