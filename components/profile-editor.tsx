"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProfileEditorProps {
  initial: any
  onSave: (updated: any) => void
  onCancel?: () => void
}

export default function ProfileEditor({ initial, onSave, onCancel }: ProfileEditorProps) {
  const [draft, setDraft] = useState<any>(initial || {})
  const [spellWarn, setSpellWarn] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const set = (path: string, value: any) => {
    setDraft((prev: any) => {
      const next = { ...prev }
      const seg = path.split(".")
      let ref: any = next
      for (let i = 0; i < seg.length - 1; i++) {
        ref[seg[i]] = ref[seg[i]] ?? {}
        ref = ref[seg[i]]
      }
      ref[seg[seg.length - 1]] = value
      return next
    })
  }

  return (
    <div className="space-y-6">
      {spellWarn && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm flex gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Hinweis zur Rechtschreibung</div>
            <div className="opacity-90">{spellWarn}</div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Titel / Zielposition</label>
          <Input value={draft.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="Senior SAP HCM Berater" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Standort</label>
          <Input
            value={draft.location || ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Frankfurt am Main"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Verfügbarkeit</label>
          <Input
            value={draft.availability || ""}
            onChange={(e) => set("availability", e.target.value)}
            placeholder="Verfügbar in 1 Monat"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Gehaltsvorstellung</label>
          <Input
            value={draft.salaryExpectation || ""}
            onChange={(e) => set("salaryExpectation", e.target.value)}
            placeholder="90.000 € / Jahr"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-600">Kurzprofil (mehrzeilig, jeweils ein Absatz)</label>
        <Textarea
          rows={4}
          value={(draft.profileSummary || []).join("\n\n")}
          onChange={(e) => set("profileSummary", e.target.value.split(/\n\n+/))}
          placeholder={"Absatz 1\n\nAbsatz 2"}
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={async () => {
            // sehr einfache Heuristik + optionaler Abruf eines lokalen Endpunkts zur KI-Prüfung
            setChecking(true)
            try {
              const text = [draft.title, draft.location, draft.availability, draft.salaryExpectation, (draft.profileSummary || []).join("\n")]
                .filter(Boolean)
                .join("\n")
              // primitive Heuristik: sehr lange Wörter und doppelte Leerzeichen
              const longWords = (text.match(/\b\w{32,}\b/g) || []).length
              const doubleSpaces = /\s{2,}/.test(text)
              let warn = ""
              if (longWords > 0) warn += `Auffällig lange Wörter gefunden (${longWords}). `
              if (doubleSpaces) warn += "Doppelte Leerzeichen gefunden. "

              // Optional: lokaler Spellcheck-Endpunkt (nicht-blockierend)
              try {
                const resp = await fetch("/api/spellcheck", { method: "POST", body: JSON.stringify({ text }), headers: { "Content-Type": "application/json" } })
                if (resp.ok) {
                  const data = await resp.json()
                  if (data?.warning) warn += data.warning
                }
              } catch {}

              setSpellWarn(warn || null)
              onSave(draft)
            } finally {
              setChecking(false)
            }
          }}
          className="bg-[#282550] text-white"
          disabled={checking}
        >
          Speichern & Vorschau aktualisieren
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </div>
  )
}


