import { describe, it, expect } from 'vitest'
import {
  AppError,
  FileError,
  OpenAIError,
  ValidationError,
  ErrorCode,
  classifyOpenAIError,
  isRetryableError,
  getUserFriendlyErrorMessage,
} from '../errors'

describe('Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'Test error',
      500,
      { detail: 'test' }
    )

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR)
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.details).toEqual({ detail: 'test' })
  })

  it('should serialize AppError to JSON', () => {
    const error = new AppError(ErrorCode.FILE_TOO_LARGE, 'File too large')
    const json = error.toJSON()

    expect(json).toEqual({
      success: false,
      error: 'File too large',
      code: ErrorCode.FILE_TOO_LARGE,
      details: undefined,
    })
  })

  it('should create FileError with 400 status', () => {
    const error = new FileError(ErrorCode.FILE_INVALID_TYPE, 'Invalid file')
    expect(error.statusCode).toBe(400)
    expect(error).toBeInstanceOf(AppError)
  })

  it('should create OpenAIError with 502 status', () => {
    const error = new OpenAIError(ErrorCode.OPENAI_API_ERROR, 'API error')
    expect(error.statusCode).toBe(502)
    expect(error).toBeInstanceOf(AppError)
  })

  it('should create ValidationError with VALIDATION_ERROR code', () => {
    const error = new ValidationError('Invalid input')
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
    expect(error.statusCode).toBe(400)
  })
})

describe('classifyOpenAIError', () => {
  it('should classify rate limit errors', () => {
    const error = { status: 429, message: 'Rate limit exceeded' }
    expect(classifyOpenAIError(error)).toBe(ErrorCode.OPENAI_RATE_LIMIT)
  })

  it('should classify authentication errors', () => {
    const error = { status: 401, message: 'Invalid API key' }
    expect(classifyOpenAIError(error)).toBe(ErrorCode.CONFIGURATION_ERROR)
  })

  it('should classify timeout errors', () => {
    const error = { status: 408, message: 'Request timeout' }
    expect(classifyOpenAIError(error)).toBe(ErrorCode.OPENAI_TIMEOUT)
  })

  it('should classify insufficient quota errors', () => {
    const error = { message: 'insufficient_quota: You exceeded your current quota' }
    expect(classifyOpenAIError(error)).toBe(ErrorCode.OPENAI_NO_CREDITS)
  })

  it('should classify server errors', () => {
    const error = { status: 503, message: 'Service unavailable' }
    expect(classifyOpenAIError(error)).toBe(ErrorCode.OPENAI_API_ERROR)
  })
})

describe('isRetryableError', () => {
  it('should mark timeout errors as retryable', () => {
    const error = new OpenAIError(ErrorCode.OPENAI_TIMEOUT, 'Timeout')
    expect(isRetryableError(error)).toBe(true)
  })

  it('should mark rate limit errors as retryable', () => {
    const error = new OpenAIError(ErrorCode.OPENAI_RATE_LIMIT, 'Rate limit')
    expect(isRetryableError(error)).toBe(true)
  })

  it('should mark API errors as retryable', () => {
    const error = new OpenAIError(ErrorCode.OPENAI_API_ERROR, 'API error')
    expect(isRetryableError(error)).toBe(true)
  })

  it('should NOT mark file errors as retryable', () => {
    const error = new FileError(ErrorCode.FILE_TOO_LARGE, 'Too large')
    expect(isRetryableError(error)).toBe(false)
  })

  it('should NOT mark validation errors as retryable', () => {
    const error = new ValidationError('Invalid')
    expect(isRetryableError(error)).toBe(false)
  })

  it('should mark 429 status as retryable', () => {
    const error = { status: 429 }
    expect(isRetryableError(error)).toBe(true)
  })

  it('should mark 503 status as retryable', () => {
    const error = { status: 503 }
    expect(isRetryableError(error)).toBe(true)
  })
})

describe('getUserFriendlyErrorMessage', () => {
  it('should return AppError message directly', () => {
    const error = new AppError(ErrorCode.FILE_TOO_LARGE, 'Custom message')
    expect(getUserFriendlyErrorMessage(error)).toBe('Custom message')
  })

  it('should return friendly message for rate limits', () => {
    const error = { message: 'rate limit exceeded' }
    expect(getUserFriendlyErrorMessage(error)).toContain('Zu viele Anfragen')
  })

  it('should return friendly message for timeouts', () => {
    const error = { message: 'timeout occurred' }
    expect(getUserFriendlyErrorMessage(error)).toContain('zu lange gedauert')
  })

  it('should return friendly message for API key errors', () => {
    const error = { message: 'Invalid api key provided' }
    expect(getUserFriendlyErrorMessage(error)).toContain('Systemkonfigurationsfehler')
  })

  it('should return generic message for unknown errors', () => {
    const error = { code: 'WEIRD_ERROR' }
    expect(getUserFriendlyErrorMessage(error)).toContain('unerwarteter Fehler')
  })
})

