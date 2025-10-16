/**
 * File-Converter-Service
 * Konvertiert verschiedene Dateiformate zu Bildern für Profil-Attachments
 * 
 * Unterstützt:
 * - PDF → JPEG (via pdfjs-dist)
 * - DOCX/DOC → JPEG (via mammoth + html2canvas)
 * - TXT → JPEG (via html2canvas)
 * - Images → direkt
 */

export interface ConvertedImage {
  name: string
  type: string
  size: number
  url: string // Data URL (base64)
}

/**
 * Konvertiert eine Datei zu einem oder mehreren Bildern
 * Läuft im Browser (Client-side)
 */
export async function convertFileToImages(file: File): Promise<ConvertedImage[]> {
  const name = (file?.name || '').toLowerCase()
  const type = file?.type || ''
  const ab = await file.arrayBuffer()

  try {
    // PDF → pdfjs → JPEGs (mehrere Seiten)
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return await convertPDFToImages(file, ab)
    }

    // DOCX/DOC → HTML → html2canvas → JPEG
    if (name.endsWith('.doc') || name.endsWith('.docx')) {
      return await convertDocumentToImage(file, ab, 'docx')
    }

    // TXT → pre-rendered → html2canvas → JPEG
    if (type.includes('text') || name.endsWith('.txt')) {
      return await convertDocumentToImage(file, ab, 'txt')
    }

    // Fallback für unbekannte Formate
    throw new Error(`Nicht unterstütztes Dateiformat: ${type || name}`)
  } catch (error) {
    console.error('File-Konvertierung fehlgeschlagen:', error)
    throw new Error(
      `Datei konnte nicht konvertiert werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    )
  }
}

/**
 * Konvertiert PDF zu JPEGs (eine pro Seite)
 */
async function convertPDFToImages(file: File, arrayBuffer: ArrayBuffer): Promise<ConvertedImage[]> {
  // Dynamischer Import für Code-Splitting
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf')
  
  // Worker für Browser
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - pdfjs-dist worker has no type definitions
    const workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.entry')).default
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
  } catch (error) {
    console.warn('PDF Worker konnte nicht geladen werden, verwende Fallback')
  }

  const uint8 = new Uint8Array(arrayBuffer)
  const pdf = await pdfjsLib.getDocument({ data: uint8, useSystemFonts: true }).promise

  const images: ConvertedImage[] = []
  const baseFileName = file.name.replace(/\.[^.]+$/, '')

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 }) // Höhere Qualität
    
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas-Kontext konnte nicht erstellt werden')
    }

    await page.render({ canvasContext: ctx, viewport }).promise
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    
    images.push({
      name: `${baseFileName}_seite-${i}.jpg`,
      type: 'image/jpeg',
      size: dataUrl.length,
      url: dataUrl,
    })
  }

  return images
}

/**
 * Konvertiert DOCX/TXT zu JPEG via HTML-Rendering
 */
async function convertDocumentToImage(
  file: File,
  arrayBuffer: ArrayBuffer,
  format: 'docx' | 'txt'
): Promise<ConvertedImage[]> {
  const { default: html2canvas } = await import('html2canvas')

  // Erstelle Container für Rendering
  const container = document.createElement('div')
  container.style.width = '794px' // A4-Breite
  container.style.padding = '32px'
  container.style.background = 'white'
  container.style.color = '#0f172a'
  container.style.lineHeight = '1.6'
  container.style.fontFamily = 'Inter, system-ui, sans-serif'
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.zIndex = '-1'
  
  document.body.appendChild(container)

  try {
    if (format === 'docx') {
      // DOCX → HTML via mammoth
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - mammoth.browser has no type definitions
      const mammoth = await import('mammoth/mammoth.browser')
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
      container.innerHTML = html
    } else {
      // TXT → Pre-Element
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(arrayBuffer)
      const pre = document.createElement('pre')
      pre.textContent = text
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.fontSize = '14px'
      pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace'
      pre.style.margin = '0'
      container.appendChild(pre)
    }

    // Rendering mit html2canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2, // Höhere Auflösung
      logging: false,
      useCORS: true,
    })

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const baseFileName = file.name.replace(/\.[^.]+$/, '')

    return [
      {
        name: `${baseFileName}.jpg`,
        type: 'image/jpeg',
        size: dataUrl.length,
        url: dataUrl,
      },
    ]
  } finally {
    // Cleanup: Container entfernen
    document.body.removeChild(container)
  }
}

/**
 * Prüft ob eine Datei konvertierbar ist
 */
export function isConvertibleFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type || ''

  return (
    type.includes('pdf') ||
    name.endsWith('.pdf') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    type.includes('text') ||
    name.endsWith('.txt')
  )
}

/**
 * Schätzt die Konvertierungsdauer basierend auf Dateigröße und -typ
 */
export function estimateConversionTime(file: File): number {
  const sizeMB = file.size / (1024 * 1024)
  const type = file.type || ''

  if (type.includes('pdf')) {
    // PDF: ~2-3 Sekunden pro MB
    return Math.max(2000, sizeMB * 2500)
  }

  if (file.name.toLowerCase().endsWith('.docx')) {
    // DOCX: ~1-2 Sekunden pro MB
    return Math.max(1500, sizeMB * 1800)
  }

  // TXT: Sehr schnell
  return Math.max(500, sizeMB * 500)
}

