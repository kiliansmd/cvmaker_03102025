// Robuste PDF-Text-Extraktion mit pdf-parse
// Funktioniert zuverlässig in Production-Umgebungen

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
  if (Buffer.isBuffer(input)) {
    console.log('✅ Konvertiere Node Buffer zu Uint8Array')
    return new Uint8Array(input)
  }
  
  throw new Error(`Unsupported binary input type. Expected Uint8Array, ArrayBuffer, or Buffer.`)
}

export async function extractTextFromPDF(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Starte PDF-Text-Extraktion...')
    
    // Konvertiere zu Buffer für pdf-parse
    let pdfBuffer: Buffer
    
    if (Buffer.isBuffer(buffer)) {
      pdfBuffer = buffer
    } else if (buffer instanceof Uint8Array) {
      // Uint8Array zu Buffer
      pdfBuffer = Buffer.from(buffer)
    } else if (buffer instanceof ArrayBuffer) {
      // ArrayBuffer zu Buffer
      pdfBuffer = Buffer.from(buffer)
    } else {
      throw new Error('Ungültiger Input-Typ für PDF-Parsing')
    }
    
    console.log(`📊 PDF-Buffer-Größe: ${pdfBuffer.length} bytes`)
    
    // Verwende pdf-parse für robuste Text-Extraktion
    // @ts-ignore - pdf-parse hat keine TypeScript-Definitionen
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(pdfBuffer, {
      // Optionen für bessere Kompatibilität
      max: 0, // Keine Seitenbegrenzung
    })
    
    console.log(`✅ PDF erfolgreich geparst: ${data.numpages} Seiten, ${data.text.length} Zeichen extrahiert`)
    
    // Bereinige den Text
    const cleanedText = data.text
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen zu einem
      .trim()
    
    return cleanedText
  } catch (error: any) {
    console.error('❌ PDF-Parsing-Fehler:', error)
    throw new Error(`PDF-Verarbeitung fehlgeschlagen: ${error?.message || String(error)}`)
  }
}