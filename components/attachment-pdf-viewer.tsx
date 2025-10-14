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
  src: string // blob: URL
}

export default function AttachmentPdfViewer({ src }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        // Hole die Blob-Daten und übergebe Uint8Array statt URL (stabiler für pdfjs)
        const res = await fetch(src, { cache: 'no-store' })
        const ab = await res.arrayBuffer()
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
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [src])

  if (error) {
    return <div className="ui-muted text-sm">{error}</div>
  }

  return <div ref={containerRef} className="space-y-4" aria-label={`PDF mit ${numPages || "?"} Seiten`} />
}



