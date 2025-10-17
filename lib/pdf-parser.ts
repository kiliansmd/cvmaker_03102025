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
  // Bereits Uint8Array → direkt zurückgeben
  if (input instanceof Uint8Array) {
    console.log('✅ Input ist bereits Uint8Array')
    return input
  }
  
  // ArrayBuffer → Uint8Array
  if (input instanceof ArrayBuffer) {
    console.log('✅ Konvertiere ArrayBuffer zu Uint8Array')
    return new Uint8Array(input)
  }
  
  // Node Buffer → Uint8Array
  // Type-Guard um TypeScript zu helfen
  if (Buffer.isBuffer(input)) {
    console.log('✅ Konvertiere Node Buffer zu Uint8Array')
    // Expliziter Cast zu Buffer für TypeScript
    const buffer = input as Buffer
    // Erstelle eine NEUE Uint8Array-Kopie (wichtiger für pdfjs-dist)
    const uint8 = new Uint8Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      uint8[i] = buffer[i]
    }
    return uint8
  }
  
  // Sollte nie erreicht werden, aber für TypeScript
  throw new Error(`Unsupported binary input type. Expected Uint8Array, ArrayBuffer, or Buffer.`)
}

export async function extractTextFromPDF(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  try {
    const uint8 = toUint8(buffer)
    const loadingTask = pdfjsLib.getDocument({ 
      data: uint8, 
      // Wichtig: Verhindere Caching-/Eval-/Font-Probleme im Server-Kontext
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true,
    } as any)
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