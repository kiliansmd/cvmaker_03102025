"use client"

import { useEffect, useRef, useState } from "react"
// pdfjs for client-side rendering of blob URLs
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.entry"
import { Loader2, FileWarning } from "lucide-react"

// Configure worker for browser
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

interface Props {
  src?: string
  file?: File
  fileName: string
  mimeType?: string
}

export default function AttachmentAnyViewer({ src, file, fileName, mimeType }: Props) {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const revokeUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      for (const u of revokeUrlsRef.current) {
        if (u.startsWith("blob:")) {
          try { URL.revokeObjectURL(u) } catch {}
        }
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function toArrayBuffer(): Promise<ArrayBuffer> {
      if (file) return await file.arrayBuffer()
      if (src) {
        const res = await fetch(src, { cache: 'no-store' })
        return await res.arrayBuffer()
      }
      throw new Error("Keine Datenquelle für Anhang")
    }

    async function render() {
      setIsLoading(true)
      setError(null)
      setImages([])
      try {
        const ab = await toArrayBuffer()
        if (cancelled) return
        // Fall 1: PDF → Seiten rendern → JPEGs
        if ((mimeType || file?.type || "").includes("pdf") || (src && src.toLowerCase().endsWith('.pdf'))) {
          const uint8 = new Uint8Array(ab)
          const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true })
          const pdf = await loadingTask.promise
          const out: string[] = []
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 1.5 })
            const canvas = document.createElement('canvas')
            canvas.width = viewport.width
            canvas.height = viewport.height
            const ctx = canvas.getContext('2d')!
            await page.render({ canvasContext: ctx, viewport }).promise
            out.push(canvas.toDataURL('image/jpeg', 0.92))
          }
          if (!cancelled) setImages(out)
          return
        }

        // Fall 2: DOCX/DOC/TXT → HTML generieren → html2canvas Snapshot
        const { default: html2canvas } = await import('html2canvas')
        const container = document.createElement('div')
        container.style.width = '794px' // A4 Breite @96dpi
        container.style.padding = '24px'
        container.style.background = 'white'
        container.style.color = '#0f172a'
        container.style.lineHeight = '1.5'
        container.style.fontFamily = 'Inter, system-ui, sans-serif'
        container.style.position = 'fixed'
        container.style.left = '-99999px'
        document.body.appendChild(container)

        const fileLower = (file?.name || src || '').toLowerCase()
        const isDoc = fileLower.endsWith('.doc') || fileLower.endsWith('.docx')
        const isTxt = (mimeType||'').includes('text') || fileLower.endsWith('.txt')

        if (isDoc) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const mammoth = await import('mammoth/mammoth.browser')
          const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab })
          container.innerHTML = html
        } else if (isTxt) {
          const decoder = new TextDecoder('utf-8')
          const text = decoder.decode(ab)
          const pre = document.createElement('pre')
          pre.textContent = text
          pre.style.whiteSpace = 'pre-wrap'
          pre.style.fontSize = '14px'
          pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace'
          container.appendChild(pre)
        } else {
          // unbekannt: als Download anzeigen
          throw new Error('Format wird nicht unterstützt – bitte PDF/DOCX/TXT verwenden.')
        }

        const canvas = await html2canvas(container, { backgroundColor: '#ffffff', scale: 2 })
        const url = canvas.toDataURL('image/jpeg', 0.92)
        revokeUrlsRef.current.push(url)
        if (!cancelled) setImages([url])
        document.body.removeChild(container)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Anhang konnte nicht gerendert werden')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    render()
    return () => { cancelled = true }
  }, [src, file, mimeType])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-slate-50 rounded-[var(--radius)] border border-slate-200 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Rendere Vorschau...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-800">
        <FileWarning className="mr-2 h-5 w-5" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {images.map((src, i) => (
        <img key={i} src={src} alt={`${fileName} – Seite ${i+1}`} className="rounded-[var(--radius)] border border-slate-200 shadow-sm w-full h-auto" />
      ))}
    </div>
  )
}


