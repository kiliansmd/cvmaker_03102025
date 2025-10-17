import mammoth from "mammoth"

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    // DOCX-First: Empfohlen und zuverlässig
    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      console.log("✅ DOCX erkannt, nutze mammoth (empfohlen)")
      return await extractTextFromDOCX(buffer)
    } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      console.log("✅ TXT erkannt")
      return buffer.toString("utf-8")
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      console.log("⚠️ PDF erkannt, versuche Extraktion (Fallback: DOCX empfohlen)")
      return await extractTextFromPDF(buffer)
    } else {
      throw new Error(`Nicht unterstützter Dateityp: ${fileType}. Bitte DOCX, PDF oder TXT verwenden.`)
    }
  } catch (error) {
    console.error("Fehler bei der Textextraktion:", error)
    throw new Error(
      `Fehler beim Lesen der Datei: ${error instanceof Error ? error.message : String(error)}. Empfehlung: Nutzen Sie DOCX-Dateien für beste Ergebnisse.`,
    )
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const { extractTextFromPDF } = await import('./pdf-parser')
    
    // Konvertiere Buffer zu Uint8Array für pdfjs-dist (wichtig für Production!)
    const uint8Array = new Uint8Array(buffer)
    const text = await extractTextFromPDF(uint8Array)
    
    console.log(`✅ PDF-Text extrahiert: ${text.length} Zeichen`)
    
    if (text.length < 100) {
      console.warn('⚠️ PDF-Extraktion lieferte sehr wenig Text - möglicherweise gescanntes PDF')
      console.warn('⚠️ Extrahierter Text:', text)
      throw new Error(`PDF enthält zu wenig Text (${text.length} Zeichen). Möglicherweise gescanntes PDF ohne Text-Layer. Bitte DOCX verwenden.`)
    }
    
    return text
  } catch (error) {
    console.error('❌ PDF-Parsing-Fehler:', error)
    // KEIN UTF-8-Fallback mehr - das erzeugt nur Müll!
    // Stattdessen: Klare Fehlermeldung
    throw new Error(
      'PDF konnte nicht verarbeitet werden. Mögliche Gründe: Gescanntes PDF ohne Text-Layer, verschlüsseltes PDF, oder beschädigte Datei. Bitte versuchen Sie es mit einer DOCX-Datei für beste Ergebnisse.',
    )
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  const text = result.value
  
  console.log(`📄 DOCX-Text extrahiert: ${text.length} Zeichen`)
  console.log(`📄 Erste 200 Zeichen: ${text.substring(0, 200)}`)
  
  if (text.length < 100) {
    console.warn('⚠️ Sehr wenig Text extrahiert - möglicherweise Problem mit Datei')
  }
  
  return text
}

/**
 * Bereinigt und kürzt extrahierten Text, um Token-Limits einzuhalten.
 * - Entfernt Steuerzeichen
 * - Komprimiert Whitespaces
 * - Entfernt ultralange Wiederholungen
 * - Kürzt auf eine sichere Länge für OpenAI-Requests
 */
export function sanitizeExtractedText(
  rawText: string,
  options: { maxChars?: number } = {}
): string {
  const maxChars = options.maxChars ?? 160_000 // ~40k Tokens grob
  if (!rawText) return ''

  // Entferne nicht druckbare Zeichen (außer gängige Umlaute)
  let text = rawText.replace(/[\u0000-\u001F\u007F]+/g, ' ')

  // Entferne extrem lange Wiederholungen desselben Zeichens
  text = text.replace(/(.)\1{9,}/g, '$1$1$1')

  // Komprimiere Whitespaces
  text = text.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n')

  // Harte Kürzung, falls zu lang: behalte Anfang und Ende
  if (text.length > maxChars) {
    const head = text.slice(0, Math.floor(maxChars * 0.6))
    const tail = text.slice(-Math.floor(maxChars * 0.4))
    text = `${head}\n\n... [gekürzt – bitte DOCX hochladen für präziseres Parsing] ...\n\n${tail}`
  }

  return text.trim()
}
