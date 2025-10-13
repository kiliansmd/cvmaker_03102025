"use client"

import { useState } from "react"
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
        <Button onClick={() => onSave(draft)} className="bg-[#282550] text-white">
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


