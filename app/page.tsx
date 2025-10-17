"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileText, Loader2, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import CandidateProfileDisplay from "@/components/candidate-profile-display"
import { processCVAction } from "./actions/process-cv"
import Image from "next/image"

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProfile, setGeneratedProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState<{ past: any[]; future: any[] }>({ past: [], future: [] })

  const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj))
  const applyProfile = (next: any) => {
    setHistory((h) => {
      if (generatedProfile == null) return h
      return { past: [...h.past, deepClone(generatedProfile)], future: [] }
    })
    setGeneratedProfile(next)
  }
  const undo = () => {
    if (!generatedProfile) return
    setHistory((h) => {
      if (h.past.length === 0) return h
      const prev = h.past[h.past.length - 1]
      setGeneratedProfile(prev)
      return { past: h.past.slice(0, -1), future: [deepClone(generatedProfile), ...h.future] }
    })
  }
  const redo = () => {
    if (!generatedProfile) return
    setHistory((h) => {
      if (h.future.length === 0) return h
      const next = h.future[0]
      setGeneratedProfile(next)
      return { past: [...h.past, deepClone(generatedProfile)], future: h.future.slice(1) }
    })
  }
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    location: "",
    salary: "Verhandlungsbereit",
    availability: "1 Monat",
    contactPerson: "Marius Kau",
    contactPhone: "+49 15888 648781",
    contactEmail: "marius.kau@getexperts.io",
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState("")

  async function convertFileToImages(file: File): Promise<string[]> {
    const name = (file?.name || '').toLowerCase()
    const type = file?.type || ''
    const ab = await file.arrayBuffer()

    // PDF → pdfjs → JPEGs
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.entry')).default
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

      const uint8 = new Uint8Array(ab)
      const pdf = await pdfjsLib.getDocument({ data: uint8, useSystemFonts: true }).promise
      const out: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.4 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        out.push(canvas.toDataURL('image/jpeg', 0.9))
      }
      return out
    }

    // DOCX/DOC/TXT → HTML → html2canvas → JPEG
    const { default: html2canvas } = await import('html2canvas')
    const container = document.createElement('div')
    container.style.width = '794px'
    container.style.padding = '24px'
    container.style.background = 'white'
    container.style.color = '#0f172a'
    container.style.lineHeight = '1.5'
    container.style.fontFamily = 'Inter, system-ui, sans-serif'
    container.style.position = 'fixed'
    container.style.left = '-99999px'
    document.body.appendChild(container)

    if (name.endsWith('.doc') || name.endsWith('.docx')) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mammoth = await import('mammoth/mammoth.browser')
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab })
      container.innerHTML = html
    } else {
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(ab)
      const pre = document.createElement('pre')
      pre.textContent = text
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.fontSize = '14px'
      pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace'
      container.appendChild(pre)
    }
    const canvas = await html2canvas(container, { backgroundColor: '#ffffff', scale: 2 })
    const url = canvas.toDataURL('image/jpeg', 0.92)
    document.body.removeChild(container)
    return [url]
  }

  const buildClientFallbackProfile = (
    name: string,
    position: string,
    location: string,
    salary: string,
    availability: string,
    contactPerson: string,
    contactPhone: string,
    contactEmail: string,
    attachments: any[] = []
  ) => {
    const initials = (name || "").split(" ").map((p) => p[0]).join("")
    return {
      title: position,
      salaryExpectation: salary,
      availability: `Verfügbar in ${availability}`,
      location,
      experienceYears: "< 1 Jahr",
      initials,
      contactPerson: {
        name: contactPerson || "",
        phone: contactPhone || "",
        email: contactEmail || "",
        website: "www.getexperts.io",
      },
      profileSummary: [
        `Profil erstellt ohne AI-Parsing. Angaben basieren auf Formularfeldern.`,
      ],
      topSkills: [],
      qualifications: [],
      personalDetails: [
        { label: "Verfügbarkeit", value: `Verfügbar in ${availability}` },
        { label: "Gehaltsvorstellung", value: salary || "-" },
        { label: "Standort", value: location || "-" },
        { label: "Zielposition", value: position || "-" },
      ],
      itSkills: [],
      languages: [],
      education: [],
      keyProjects: [],
      experienceTimeline: [],
      careerGoals: [],
      interests: [],
      personalityTraits: [],
      motivationFactors: [],
      attachments,
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (file.size > maxSize) {
        setError("Die Datei ist zu groß. Maximale Größe: 10MB")
        return
      }

      setCvFile(file)
      setError(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      // Client-seitige Validierung, um deaktivierten Button zu vermeiden
      if (!cvFile || !formData.name.trim() || !formData.position.trim() || !formData.location.trim()) {
        setError("Bitte wählen Sie eine Datei und füllen Sie Name, Zielposition und Standort aus.")
        setIsGenerating(false)
        return
      }
      // Erstelle FormData für Server Action
      const formDataToSend = new FormData()
      if (cvFile) formDataToSend.append("cvFile", cvFile)
      formDataToSend.append("name", formData.name)
      formDataToSend.append("position", formData.position)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("salary", formData.salary)
      formDataToSend.append("availability", formData.availability)
      formDataToSend.append("contactPerson", formData.contactPerson)
      formDataToSend.append("contactPhone", formData.contactPhone)
      formDataToSend.append("contactEmail", formData.contactEmail)
      formDataToSend.append("additionalInfo", additionalInfo)
      // Cache-Busting: Eindeutige Request-ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      formDataToSend.append("requestId", requestId)

      console.log("📤 Sende CV zur Verarbeitung...")
      console.log("🆔 Request-ID (Cache-Busting):", requestId)

      // Rufe Server Action auf (Schritt 1: Parsing)
      const result = await processCVAction(formDataToSend)

      if (result && typeof result === 'object' && 'success' in result && (result as any).success && (result as any).data) {
        console.log("✅ Profil erfolgreich erstellt!")
        console.log("📊 Server-Response-Data:", (result as any).data)
        
        // Schritt 2: Nach dem Parsing → Datei zu Bildern konvertieren
        let attachments: any[] = []
        if (cvFile) {
          try {
            const images = await convertFileToImages(cvFile)
            attachments = images.map((src, idx) => ({
              name: `${cvFile.name.replace(/\.[^.]+$/, '')}_page-${idx + 1}.jpg`,
              type: 'image/jpeg',
              size: src.length,
              url: src,
            }))
          } catch (convErr) {
            console.warn('Konvertierung zu Bildern fehlgeschlagen:', convErr)
            attachments = []
          }
        }
        
        // Wenn Daten leer/unvollständig sind, mische Formularinfos rein
        const data = (result as any).data || {}
        
        console.log("📊 Received Data Arrays:", {
          profileSummary: data.profileSummary?.length || 0,
          itSkills: data.itSkills?.length || 0,
          languages: data.languages?.length || 0,
          education: data.education?.length || 0,
          experienceTimeline: data.experienceTimeline?.length || 0,
          topSkills: data.topSkills?.length || 0,
        })
        
        const normalized = {
          ...data,
          title: data.title || formData.position,
          availability: data.availability || `Verfügbar in ${formData.availability}`,
          salaryExpectation: data.salaryExpectation || formData.salary,
          location: data.location || formData.location,
          profileSummary: Array.isArray(data.profileSummary) && data.profileSummary.length > 0 ? data.profileSummary : [],
          itSkills: Array.isArray(data.itSkills) && data.itSkills.length > 0 ? data.itSkills : [],
          languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : [],
          education: Array.isArray(data.education) && data.education.length > 0 ? data.education : [],
          qualifications: Array.isArray(data.qualifications) && data.qualifications.length > 0 ? data.qualifications : [],
          personalDetails: Array.isArray(data.personalDetails) && data.personalDetails.length > 0 ? data.personalDetails : [],
          topSkills: Array.isArray(data.topSkills) && data.topSkills.length > 0 ? data.topSkills : [],
          keyProjects: Array.isArray(data.keyProjects) && data.keyProjects.length > 0 ? data.keyProjects : [],
          experienceTimeline: Array.isArray(data.experienceTimeline) && data.experienceTimeline.length > 0 ? data.experienceTimeline : [],
        }
        
        console.log("📊 Normalized Profile:", {
          title: normalized.title,
          itSkills: normalized.itSkills.length,
          languages: normalized.languages.length,
          education: normalized.education.length,
        })
        
        // Schritt 3/4: Ziellayout mit Feldern + konvertierten Bildern rendern
        setGeneratedProfile((prev: any) => ({ ...normalized, attachments }))
        // Vorschau nach oben und im Vollbild anzeigen
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else {
        // Server hat Fehler zurückgegeben
        console.error("❌ Server-Action Fehler:", result)
        const errorMsg = (result as any)?.error || "Unbekannter Fehler beim CV-Processing"
        const errorCode = (result as any)?.code || "UNKNOWN"
        
        console.error("❌ Error-Code:", errorCode)
        console.error("❌ Error-Message:", errorMsg)
        
        setError(`CV-Verarbeitung fehlgeschlagen: ${errorMsg}`)
        setIsGenerating(false)
        return
      }
    } catch (err: any) {
      console.error("❌ Fehler bei der Profilerstellung:", err)
      setError(err.message || "Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setGeneratedProfile(null)
    setCvFile(null)
    setAdditionalInfo("")
    setError(null)
    setFormData({
      name: "",
      position: "",
      location: "",
      salary: "Verhandlungsbereit",
      availability: "1 Monat",
      contactPerson: "Marius Kau",
      contactPhone: "+49 15888 648781",
      contactEmail: "marius.kau@getexperts.io",
    })
  }

  // Wenn ein Profil generiert wurde, zeige es an
  if (generatedProfile) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50 no-print flex flex-col gap-2">
          <Button onClick={handleReset} variant="outline" className="shadow-lg bg-white text-[rgb(var(--brand))] border border-[rgb(var(--brand))] hover:bg-white/80 ui-focus">
            ← Neues Profil erstellen
          </Button>
          <Button onClick={() => setIsEditing((v) => !v)} className="bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-600))] text-white">
            {isEditing ? 'Speichern' : 'Bearbeiten'}
          </Button>
          {isEditing && (
            <div className="flex gap-2">
              <Button type="button" onClick={undo} disabled={!history.past.length} className={`bg-white text-[rgb(var(--brand))] border border-slate-200 hover:bg-slate-50 ${!history.past.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Zurück
              </Button>
              <Button type="button" onClick={redo} disabled={!history.future.length} className={`bg-white text-[rgb(var(--brand))] border border-slate-200 hover:bg-slate-50 ${!history.future.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Vor
              </Button>
            </div>
          )}
        </div>
        <CandidateProfileDisplay profileData={generatedProfile} editable={isEditing} onChange={applyProfile} />
      </div>
    )
  }

  // Upload-Formular (nur sichtbar, wenn NICHT in Generierung)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-[#282550]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-semibold">Profil wird erstellt…</span>
          </div>
        </div>
      )}
      <div className={`container mx-auto px-4 py-12 ${isGenerating ? 'hidden' : ''}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block mb-6">
              <Image src="/getexperts-logo.png" alt="getexperts Logo" width={200} height={67} />
            </div>
            <h1 className="text-4xl font-bold text-[rgb(var(--brand))] tracking-tight mb-3">Kandidatenprofil Generator</h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Laden Sie einen Lebenslauf hoch und generieren Sie automatisch ein professionelles Kandidatenprofil im
              getexperts.io Design - powered by OpenAI GPT-4.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Fehler bei der Verarbeitung:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Upload-Formular */}
          <div className="ui-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* CV Upload */}
              <div className="space-y-3">
                <Label htmlFor="cv-upload" className="ui-section-title text-lg">
                  Lebenslauf hochladen * (Empfohlen: DOCX)
                </Label>
                <div className="relative">
                  <Input
                    id="cv-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-[var(--radius)] hover:border-[rgb(var(--brand))] hover:bg-slate-50 transition-all cursor-pointer ui-focus"
                  >
                    {cvFile ? (
                      <>
                        <FileText className="h-8 w-8 text-[rgb(var(--brand))]" />
                        <div className="text-left">
                          <p className="font-medium text-[rgb(var(--brand))]">{cvFile.name}</p>
                          <p className="text-sm text-slate-500">{(cvFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-400" />
                        <div className="text-center">
                          <p className="font-medium text-slate-700">
                            Klicken Sie hier oder ziehen Sie eine Datei hinein
                          </p>
                          <p className="text-sm text-slate-500">DOCX empfohlen, auch PDF oder TXT (max. 10MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs ui-muted">💡 Tipp: DOCX-Dateien werden am zuverlässigsten verarbeitet</p>
              </div>

              {/* Kandidaten-Informationen */}
              <div className="space-y-6">
                <h3 className="text-lg ui-section-title flex items-center gap-2">
                  <ChevronRight className="h-5 w-5" />
                  Kandidaten-Informationen
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name des Kandidaten *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="z.B. Max Mustermann"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Zielposition *</Label>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      placeholder="z.B. SAP HCM Berater"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Standort *</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="z.B. Frankfurt am Main"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">Gehaltsvorstellung</Label>
                    <Input
                      id="salary"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="z.B. 80.000 € / Jahr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Verfügbarkeit</Label>
                    <Input
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      placeholder="z.B. 1 Monat"
                    />
                  </div>
                </div>
              </div>

              {/* Kontaktperson */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#282550] flex items-center gap-2">
                  <ChevronRight className="h-5 w-5" />
                  Kontaktperson
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Name</Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder="Marius Kau"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefon</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="+49 15888 648781"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-Mail</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="marius.kau@getexperts.io"
                    />
                  </div>
                </div>
              </div>

              {/* Zusätzliche Informationen */}
              <div className="space-y-3">
                <Label htmlFor="additionalInfo" className="text-lg font-semibold text-[#282550]">
                  Zusätzliche Informationen (optional)
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Besondere Qualifikationen, Projekte, Schwerpunkte, Kontext für die Profilgenerierung, etc."
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-600))] text-white py-6 text-lg font-semibold rounded-[var(--radius)] transition-all ui-focus"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Profil wird erstellt mit AI...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Profil generieren mit GPT-4
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Info-Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">🤖 Wie funktioniert die AI-Verarbeitung?</h4>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>Der hochgeladene CV wird automatisch analysiert (DOCX empfohlen, auch PDF oder TXT)</li>
              <li>OpenAI GPT-4 extrahiert alle relevanten Informationen strukturiert</li>
              <li>Das System erkennt: Berufserfahrung, Skills, Ausbildung, Zertifikate, Projekte</li>
              <li>Automatische Generierung eines professionellen Profils im getexperts.io Design</li>
              <li>Vollständig anpassbar mit zusätzlichen Informationen und Framing</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
