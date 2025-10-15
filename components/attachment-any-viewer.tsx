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
    // Helper: noop (keine PDF-Embed-Fallbacks mehr)
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
        // Direkt Bilddatei? Dann direkt anzeigen (auch für data:image/* URLs)
        const lowerSrc = (src || '').toLowerCase()
        const extIsImage = /(\.jpg|\.jpeg|\.png|\.webp|\.gif)$/i.test(lowerSrc)
        const typeIsImage = (mimeType || file?.type || '').startsWith('image/')
        const dataIsImage = lowerSrc.startsWith('data:image/')
        if (typeIsImage || dataIsImage || extIsImage) {
          let imgUrl = src || ''
          if (!imgUrl && file) imgUrl = URL.createObjectURL(file)
          if (!imgUrl) throw new Error('Kein Bild verfügbar')
          if (!cancelled) setImages([imgUrl])
          return
        }
        const ab = await toArrayBuffer()
        if (cancelled) return
        // Fall 1: PDF → Seiten rendern → JPEGs
        if ((mimeType || file?.type || "").includes("pdf") || (src && src.toLowerCase().endsWith('.pdf'))) {
          let pdf: any
          try {
            const uint8 = new Uint8Array(ab)
            pdf = await pdfjsLib.getDocument({ data: uint8, useSystemFonts: true, isEvalSupported: true }).promise
          } catch (primaryErr) {
            if (src) {
              try {
                pdf = await pdfjsLib.getDocument({ url: src, useSystemFonts: true, isEvalSupported: true }).promise
              } catch (secondaryErr) {
                throw secondaryErr
              }
            } else {
              throw primaryErr
            }
          }
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
    const url = src || (file ? URL.createObjectURL(file) : undefined)
    return (
      <div className="space-y-3">
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-800">
          <FileWarning className="mr-2 h-5 w-5" />
          {error}
        </div>
        {url && (
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noopener" className="px-3 py-2 rounded-[var(--radius)] border border-slate-200 text-sm hover:bg-slate-50">Im Tab öffnen</a>
            <a href={url} download className="px-3 py-2 rounded-[var(--radius)] border border-slate-200 text-sm hover:bg-slate-50">Download</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {images.map((src, i) => (
        <div key={i} className="space-y-2">
          <img src={src} alt={`${fileName} – Seite ${i+1}`} className="rounded-[var(--radius)] border border-slate-200 shadow-sm w-full h-auto" />
          <div className="text-right">
            <a href={src} download={`${fileName.replace(/\.[^.]+$/, '')}_page-${i+1}.jpg`} className="px-2 py-1 text-xs rounded-[var(--radius)] border border-slate-200 hover:bg-slate-50">Bild speichern</a>
          </div>
        </div>
      ))}
    </div>
  )
}


