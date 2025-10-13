import mammoth from "mammoth"

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    if (fileType === "application/pdf") {
      return await extractTextFromPDF(buffer)
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      return await extractTextFromDOCX(buffer)
    } else if (fileType === "text/plain") {
      return buffer.toString("utf-8")
    } else {
      throw new Error(`Nicht unterstützter Dateityp: ${fileType}`)
    }
  } catch (error) {
    console.error("Fehler bei der Textextraktion:", error)
    throw new Error("Fehler beim Lesen der Datei. Bitte stellen Sie sicher, dass die Datei korrekt formatiert ist.")
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
