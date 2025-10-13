// Lightweight PDF text extraction using pdfjs-dist legacy build
// Works in Node (server actions) without native deps

// We use the legacy build paths to avoid bundler issues
// and set the worker entry explicitly
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - pdfjs-dist provides JS modules
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - worker entry export is JS
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'

// configure worker for Node/bundled environment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function extractTextFromPDF(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  try {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer)
    const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true })
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


