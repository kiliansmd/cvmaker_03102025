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
    return await extractTextFromPDF(buffer)
  } catch (error) {
    console.error('PDF-Parsing-Fehler:', error)
    try {
      const text = buffer.toString('utf-8')
      return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim()
    } catch {
      throw new Error(
        'PDF konnte nicht verarbeitet werden. Bitte versuchen Sie es mit einer DOCX-Datei oder konvertieren Sie die PDF.',
      )
    }
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
