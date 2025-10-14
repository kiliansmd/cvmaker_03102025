"use client"

import { useEffect, useRef, useState } from "react"
// pdfjs for client-side rendering of blob URLs
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.entry"

// Configure worker for browser
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

interface Props {
  src?: string // blob: URL
  file?: File
}

export default function AttachmentPdfViewer({ src, file }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        // Hole die Blob-Daten und übergebe Uint8Array statt URL (stabiler für pdfjs)
        let ab: ArrayBuffer
        if (file) {
          ab = await file.arrayBuffer()
        } else if (src) {
          const res = await fetch(src, { cache: 'no-store' })
          ab = await res.arrayBuffer()
        } else {
          throw new Error('Keine Quelle für PDF')
        }
        const uint8 = new Uint8Array(ab)
        const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true })
        const pdf = await loadingTask.promise
        if (cancelled) return
        setNumPages(pdf.numPages)
        const container = containerRef.current
        if (!container) return
        container.innerHTML = ""

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          if (cancelled) return
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")!
          await page.render({ canvasContext: ctx, viewport }).promise
          // Konvertiere jede Seite in ein JPEG und bette als <img> ein
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
          const img = document.createElement('img')
          img.src = dataUrl
          img.alt = `PDF Seite ${i}`
          img.className = "border border-slate-200 rounded-[var(--radius)] bg-white shadow-sm w-full h-auto"
          container.appendChild(img)
        }
      } catch (e: any) {
        setError(e?.message || "PDF konnte nicht dargestellt werden")
        // Fallback: systemeigener PDF-Viewer per iframe mit Blob-URL
        try {
          const url = src || (file ? URL.createObjectURL(file) : null)
          if (url) setFallbackUrl(url)
        } catch {}
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [src])

  if (error && fallbackUrl) {
    return (
      <div className="rounded-[var(--radius)] overflow-hidden border border-slate-200">
        <iframe src={fallbackUrl} className="w-full h-[800px] bg-white" title="PDF Fallback" />
      </div>
    )
  }

  return <div ref={containerRef} className="space-y-4" aria-label={`PDF mit ${numPages || "?"} Seiten`} />
}



