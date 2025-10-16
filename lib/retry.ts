import { isRetryableError } from './errors'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  timeout?: number
  onRetry?: (attempt: number, error: any) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  timeout: 60000,
  onRetry: () => {},
}

/**
 * Führt eine Funktion mit Exponential Backoff Retry aus
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Timeout-Wrapper
      if (opts.timeout > 0) {
        return await withTimeout(fn(), opts.timeout)
      }
      return await fn()
    } catch (error) {
      lastError = error

      // Letzter Versuch? Fehler werfen
      if (attempt === opts.maxRetries) {
        throw error
      }

      // Nicht retryable? Sofort werfen
      if (!isRetryableError(error)) {
        throw error
      }

      // Berechne Delay mit Exponential Backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      )

      // Optional: Jitter hinzufügen (±25%)
      const jitter = delay * 0.25 * (Math.random() - 0.5)
      const actualDelay = Math.max(0, delay + jitter)

      console.warn(
        `⚠️ Retry ${attempt + 1}/${opts.maxRetries} nach ${Math.round(actualDelay)}ms:`,
        error?.message || error
      )

      opts.onRetry(attempt + 1, error)

      // Warten vor nächstem Versuch
      await sleep(actualDelay)
    }
  }

  throw lastError
}

/**
 * Timeout-Wrapper für Promises
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout nach ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Sleep-Utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry mit Circuit Breaker Pattern
 * Verhindert wiederholte Fehler bei dauerhaften Ausfällen
 */
export class CircuitBreaker<T> {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number
      resetTimeout?: number
      retryOptions?: RetryOptions
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000,
      ...options,
    }
  }

  async execute(): Promise<T> {
    // Circuit ist offen? Sofort fehlschlagen
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime
      if (timeSinceLastFailure < this.options.resetTimeout!) {
        throw new Error(
          `Circuit Breaker ist offen. Versuche es in ${Math.round((this.options.resetTimeout! - timeSinceLastFailure) / 1000)}s erneut.`
        )
      }
      // Timeout abgelaufen, versuche Half-Open
      this.state = 'half-open'
    }

    try {
      const result = await withRetry(this.fn, this.options.retryOptions)

      // Erfolg! Reset
      this.failureCount = 0
      this.state = 'closed'
      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.options.failureThreshold!) {
        this.state = 'open'
        console.error(
          `🔴 Circuit Breaker geöffnet nach ${this.failureCount} Fehlern`
        )
      }

      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    }
  }

  reset() {
    this.failureCount = 0
    this.state = 'closed'
    this.lastFailureTime = 0
  }
}

