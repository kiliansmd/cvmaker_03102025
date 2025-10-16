/**
 * Custom Error Types für bessere Fehlerbehandlung
 */

export enum ErrorCode {
  // File-related errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_EXTRACTION_FAILED = 'FILE_EXTRACTION_FAILED',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  
  // OpenAI-related errors
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  OPENAI_TIMEOUT = 'OPENAI_TIMEOUT',
  OPENAI_INVALID_RESPONSE = 'OPENAI_INVALID_RESPONSE',
  OPENAI_NO_CREDITS = 'OPENAI_NO_CREDITS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Processing errors
  CV_PARSING_FAILED = 'CV_PARSING_FAILED',
  PROFILE_GENERATION_FAILED = 'PROFILE_GENERATION_FAILED',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  
  // System errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    }
  }
}

// Spezifische Error-Klassen
export class FileError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 400, details)
    this.name = 'FileError'
  }
}

export class OpenAIError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 502, details)
    this.name = 'OpenAIError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * Klassifiziert OpenAI-Fehler für bessere Retry-Logik
 */
export function classifyOpenAIError(error: any): ErrorCode {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status || error?.response?.status

  if (status === 429 || message.includes('rate limit')) {
    return ErrorCode.OPENAI_RATE_LIMIT
  }
  if (status === 401 || message.includes('api key') || message.includes('authentication')) {
    return ErrorCode.CONFIGURATION_ERROR
  }
  if (message.includes('timeout') || status === 408) {
    return ErrorCode.OPENAI_TIMEOUT
  }
  if (message.includes('insufficient_quota') || message.includes('credits')) {
    return ErrorCode.OPENAI_NO_CREDITS
  }
  if (status >= 500) {
    return ErrorCode.OPENAI_API_ERROR
  }

  return ErrorCode.OPENAI_API_ERROR
}

/**
 * Prüft ob ein Fehler retryable ist
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof AppError) {
    return [
      ErrorCode.OPENAI_TIMEOUT,
      ErrorCode.OPENAI_RATE_LIMIT,
      ErrorCode.OPENAI_API_ERROR,
    ].includes(error.code)
  }

  const status = error?.status || error?.response?.status
  // Retry bei 429 (Rate Limit), 503 (Service Unavailable), 504 (Gateway Timeout)
  return status === 429 || status === 503 || status === 504 || status === 408
}

/**
 * Benutzerfreundliche Fehlermeldungen
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message
  }

  const errorCode = error?.code || ''
  const message = error?.message?.toLowerCase() || ''

  if (errorCode === 'ENOENT') {
    return 'Datei konnte nicht gefunden werden.'
  }
  if (message.includes('rate limit')) {
    return 'Zu viele Anfragen. Bitte versuchen Sie es in wenigen Sekunden erneut.'
  }
  if (message.includes('timeout')) {
    return 'Die Verarbeitung hat zu lange gedauert. Bitte versuchen Sie es erneut.'
  }
  if (message.includes('api key')) {
    return 'Systemkonfigurationsfehler. Bitte kontaktieren Sie den Support.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.'
  }

  return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
}

