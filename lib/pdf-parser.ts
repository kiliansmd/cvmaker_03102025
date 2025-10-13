// Lightweight PDF text extraction using pdfjs-dist legacy build
// Robust für Node/Server (keine Worker, nur Uint8Array)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - pdfjs-dist provides JS modules
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

// Keine Worker im Server-Kontext verwenden
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = undefined

function toUint8(input: Buffer | Uint8Array | ArrayBuffer): Uint8Array {
  // Bereits korrekt
  if (input instanceof Uint8Array) return input
  // ArrayBuffer → Uint8Array
  if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input)
  // Node Buffer → Uint8Array (unter Beibehaltung von Offset/Length)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const maybeBuf = input as any
  if (typeof Buffer !== 'undefined' && maybeBuf && maybeBuf.constructor && maybeBuf.constructor.name === 'Buffer') {
    const b = maybeBuf as Buffer
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  }
  // Fallback – letzter Versuch über Kopie
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Uint8Array(maybeBuf)
  } catch {
    throw new Error('Unsupported binary input – expected Uint8Array/ArrayBuffer/Buffer')
  }
}

export async function extractTextFromPDF(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  try {
    const uint8 = toUint8(buffer)
    const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true } as any)
    const pdf = await loadingTask.promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = (textContent.items as Array<{ str?: string }>)
        .map((item) => item?.str || '')
        .join(' ')
      fullText += pageText + '\n'
    }
    return fullText.trim()
  } catch (error: any) {
    // Re-throw with readable message; upstream code will handle fallback
    throw new Error(`PDF-Verarbeitung fehlgeschlagen: ${error?.message || String(error)}`)
  }
}


