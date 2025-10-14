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
        const loadingTask = pdfjsLib.getDocument({ url: src, useSystemFonts: true })
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
          canvas.className = "border border-slate-200 rounded-[var(--radius)] bg-white shadow-sm"
          container.appendChild(canvas)
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



