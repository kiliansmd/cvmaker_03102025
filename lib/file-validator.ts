import { fileTypeFromBuffer } from 'file-type'
import { FileError, ErrorCode } from './errors'
import { AllowedMimeTypes } from './schemas'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_FILE_SIZE = 100 // 100 bytes

// Erlaubte File Extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'] as const

// Magic Bytes für manuelle Validierung als Fallback
const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  DOCX: [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP-based)
  DOC: [0xd0, 0xcf, 0x11, 0xe0], // DOC magic
} as const

export interface FileValidationResult {
  isValid: boolean
  mimeType?: string
  extension?: string
  size: number
  errors: string[]
}

/**
 * Validiert eine hochgeladene Datei umfassend
 * - Größe
 * - MIME-Type (Magic Bytes)
 * - File Extension
 * - Inhalt (keine leeren Dateien)
 */
export async function validateFile(
  file: File | Buffer,
  options: {
    maxSize?: number
    minSize?: number
    allowedTypes?: readonly string[]
  } = {}
): Promise<FileValidationResult> {
  const maxSize = options.maxSize || MAX_FILE_SIZE
  const minSize = options.minSize || MIN_FILE_SIZE
  const allowedTypes = options.allowedTypes || AllowedMimeTypes

  const errors: string[] = []
  let buffer: Buffer

  // File zu Buffer konvertieren
  if (file instanceof Buffer) {
    buffer = file
  } else {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  }

  const size = buffer.length
  const fileName = file instanceof File ? file.name : 'file'

  // 1. Größen-Validierung
  if (size > maxSize) {
    throw new FileError(
      ErrorCode.FILE_TOO_LARGE,
      `Datei ist zu groß (${(size / 1024 / 1024).toFixed(2)}MB). Maximum: ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      { size, maxSize }
    )
  }

  if (size < minSize) {
    throw new FileError(
      ErrorCode.FILE_CORRUPTED,
      `Datei ist zu klein oder leer (${size} bytes)`,
      { size, minSize }
    )
  }

  // 2. MIME-Type-Validierung via Magic Bytes
  let detectedType: string | undefined
  let detectedExtension: string | undefined

  try {
    const fileType = await fileTypeFromBuffer(buffer)
    if (fileType) {
      detectedType = fileType.mime
      detectedExtension = `.${fileType.ext}`
    }
  } catch (error) {
    console.warn('file-type detection failed, falling back to manual detection')
  }

  // Fallback: Manuelle Magic Bytes Detection
  if (!detectedType) {
    detectedType = detectMimeTypeManually(buffer)
  }

  // 3. Extension-Validierung (falls File-Objekt)
  if (file instanceof File) {
    const fileExtension = getFileExtension(fileName).toLowerCase()
    
    if (!ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
      throw new FileError(
        ErrorCode.FILE_INVALID_TYPE,
        `Dateityp nicht erlaubt: ${fileExtension}. Erlaubt: ${ALLOWED_EXTENSIONS.join(', ')}`,
        { extension: fileExtension, allowed: ALLOWED_EXTENSIONS }
      )
    }

    // Extension-MIME-Type Mismatch prüfen
    if (detectedType && detectedExtension && detectedExtension !== fileExtension) {
      console.warn(
        `⚠️ Extension mismatch: Datei hat Extension ${fileExtension} aber MIME-Type ${detectedType} (${detectedExtension})`
      )
      // Nicht blockieren, aber warnen
    }
  }

  // 4. MIME-Type gegen Whitelist prüfen
  if (detectedType && !allowedTypes.includes(detectedType)) {
    // Spezialfall: text/plain wird oft nicht erkannt
    if (!detectedType.startsWith('text/') && !detectedType.includes('zip')) {
      throw new FileError(
        ErrorCode.FILE_INVALID_TYPE,
        `Dateityp nicht erlaubt: ${detectedType}. Erlaubt: PDF, DOCX, DOC, TXT`,
        { mimeType: detectedType, allowed: allowedTypes }
      )
    }
  }

  // 5. Inhaltliche Validierung
  const contentErrors = validateFileContent(buffer, detectedType)
  errors.push(...contentErrors)

  return {
    isValid: errors.length === 0,
    mimeType: detectedType,
    extension: detectedExtension,
    size,
    errors,
  }
}

/**
 * Manuelle MIME-Type-Detection via Magic Bytes
 */
function detectMimeTypeManually(buffer: Buffer): string | undefined {
  // PDF
  if (matchesMagicBytes(buffer, MAGIC_BYTES.PDF)) {
    return 'application/pdf'
  }

  // DOCX (ZIP-based)
  if (matchesMagicBytes(buffer, MAGIC_BYTES.DOCX)) {
    // Prüfe ob es wirklich DOCX ist (hat [Content_Types].xml im ZIP)
    const bufferStr = buffer.toString('utf8', 0, Math.min(1000, buffer.length))
    if (bufferStr.includes('word/') || bufferStr.includes('[Content_Types].xml')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }

  // DOC (old format)
  if (matchesMagicBytes(buffer, MAGIC_BYTES.DOC)) {
    return 'application/msword'
  }

  // Text-Files (heuristic)
  if (isLikelyText(buffer)) {
    return 'text/plain'
  }

  return undefined
}

/**
 * Prüft ob Buffer mit Magic Bytes übereinstimmt
 */
function matchesMagicBytes(buffer: Buffer, magicBytes: readonly number[]): boolean {
  if (buffer.length < magicBytes.length) return false
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) return false
  }
  return true
}

/**
 * Heuristik: Ist es eine Text-Datei?
 */
function isLikelyText(buffer: Buffer): boolean {
  const sample = buffer.slice(0, Math.min(1000, buffer.length))
  let printableChars = 0
  
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i]
    // Printable ASCII + Whitespace
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableChars++
    }
  }

  const ratio = printableChars / sample.length
  return ratio > 0.85 // 85%+ printable = wahrscheinlich Text
}

/**
 * Validiert File-Inhalt (keine komplett leeren Dateien, etc.)
 */
function validateFileContent(buffer: Buffer, mimeType?: string): string[] {
  const errors: string[] = []

  // Prüfe auf komplett leere/null-byte Dateien
  const nonZeroBytes = buffer.filter((b) => b !== 0).length
  if (nonZeroBytes < 50) {
    errors.push('Datei scheint leer oder korrupt zu sein (zu wenig Inhalt)')
  }

  // PDF-spezifische Validierung
  if (mimeType === 'application/pdf') {
    const pdfHeader = buffer.slice(0, 5).toString('utf8')
    if (!pdfHeader.startsWith('%PDF')) {
      errors.push('PDF-Header fehlt oder ist korrupt')
    }
  }

  return errors
}

/**
 * Extrahiert File-Extension
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) return ''
  return fileName.slice(lastDot)
}

/**
 * Convenience-Function: Validiere und werfe bei Fehler
 */
export async function validateFileOrThrow(
  file: File | Buffer,
  options?: Parameters<typeof validateFile>[1]
): Promise<void> {
  const result = await validateFile(file, options)
  
  if (!result.isValid) {
    throw new FileError(
      ErrorCode.FILE_INVALID_TYPE,
      `Datei-Validierung fehlgeschlagen: ${result.errors.join(', ')}`,
      result
    )
  }
}

