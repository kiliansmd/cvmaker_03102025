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
    const text = await extractTextFromPDF(buffer)
    console.log(`✅ PDF-Text extrahiert: ${text.length} Zeichen`)
    
    if (text.length < 100) {
      console.warn('⚠️ PDF-Extraktion lieferte sehr wenig Text - möglicherweise gescanntes PDF')
      console.warn('⚠️ Extrahierter Text:', text)
    }
    
    return text
  } catch (error) {
    console.error('❌ PDF-Parsing-Fehler:', error)
    console.warn('⚠️ Versuche Fallback: UTF-8 decode')
    
    try {
      const text = buffer.toString('utf-8')
      const cleaned = text.replace(/[^\x20-\x7E\n\r\täöüÄÖÜß]/g, ' ').trim()
      
      if (cleaned.length < 50) {
        throw new Error(`PDF-Fallback lieferte nur ${cleaned.length} Zeichen. Bitte DOCX verwenden.`)
      }
      
      console.log(`✅ PDF-Fallback erfolgreich: ${cleaned.length} Zeichen`)
      return cleaned
    } catch (fallbackError) {
      console.error('❌ PDF-Fallback fehlgeschlagen:', fallbackError)
      throw new Error(
        'PDF konnte nicht verarbeitet werden (möglicherweise gescanntes PDF ohne Text-Layer). Bitte versuchen Sie es mit einer DOCX-Datei.',
      )
    }
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
