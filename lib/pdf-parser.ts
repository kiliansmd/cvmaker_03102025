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
  if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) {
    console.log('✅ Konvertiere ArrayBuffer zu Uint8Array')
    return new Uint8Array(input)
  }
  
  // Node Buffer → Uint8Array
  // WICHTIG: In Production/Server-Context ist Buffer verfügbar
  if (Buffer.isBuffer(input)) {
    console.log('✅ Konvertiere Node Buffer zu Uint8Array')
    // Erstelle eine NEUE Uint8Array-Kopie (wichtiger für pdfjs-dist)
    const uint8 = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) {
      uint8[i] = input[i]
    }
    return uint8
  }
  
  // Fallback für andere Typen
  console.warn('⚠️ Unbekannter Input-Typ, versuche direkte Konvertierung')
  try {
    return new Uint8Array(input as any)
  } catch (error) {
    throw new Error(`Unsupported binary input type: ${typeof input}. Expected Uint8Array, ArrayBuffer, or Buffer.`)
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


