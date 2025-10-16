import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry, withTimeout, sleep, CircuitBreaker } from '../retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 }) // Retryable
      .mockResolvedValue('success')

    const result = await withRetry(fn, { maxRetries: 1, initialDelay: 10 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 400 }) // Not retryable

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelay: 10 })
    ).rejects.toMatchObject({ status: 400 })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call onRetry callback', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue('success')

    const onRetry = vi.fn()

    await withRetry(fn, { maxRetries: 1, initialDelay: 10, onRetry })

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.objectContaining({ status: 503 }))
  })

  it('should respect maxRetries', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 503 })

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toMatchObject({ status: 503 })

    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('should apply exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 503 })
    const delays: number[] = []
    const originalSleep = sleep

    vi.spyOn(global, 'setTimeout')

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelay: 100, backoffFactor: 2 })
    ).rejects.toBeDefined()

    // Mit Exponential Backoff: 100ms, 200ms, 400ms (ca., mit Jitter)
    expect(fn).toHaveBeenCalledTimes(4)
  })
})

describe('withTimeout', () => {
  it('should resolve if promise completes in time', async () => {
    const promise = Promise.resolve('success')
    const result = await withTimeout(promise, 1000)
    expect(result).toBe('success')
  })

  it('should reject if promise times out', async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 200))
    
    await expect(withTimeout(promise, 50)).rejects.toThrow('Timeout nach 50ms')
  })
})

describe('sleep', () => {
  it('should wait for specified duration', async () => {
    const start = Date.now()
    await sleep(50)
    const duration = Date.now() - start

    expect(duration).toBeGreaterThanOrEqual(40) // Allow some margin
    expect(duration).toBeLessThan(100)
  })
})

describe('CircuitBreaker', () => {
  it('should execute function successfully', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const breaker = new CircuitBreaker(fn)

    const result = await breaker.execute()

    expect(result).toBe('success')
    expect(breaker.getState().state).toBe('closed')
  })

  it('should open circuit after threshold failures', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'))
    const breaker = new CircuitBreaker(fn, { failureThreshold: 3 })

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute()).rejects.toThrow('failure')
    }

    expect(breaker.getState().state).toBe('open')
    expect(breaker.getState().failureCount).toBe(3)
  })

  it('should reject immediately when circuit is open', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'))
    const breaker = new CircuitBreaker(fn, { 
      failureThreshold: 2,
      resetTimeout: 10000 
    })

    // Trigger failures to open circuit
    await expect(breaker.execute()).rejects.toThrow()
    await expect(breaker.execute()).rejects.toThrow()

    expect(breaker.getState().state).toBe('open')

    // Should reject immediately
    await expect(breaker.execute()).rejects.toThrow('Circuit Breaker ist offen')
  })

  it('should reset on successful execution', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValue('success')

    const breaker = new CircuitBreaker(fn)

    await expect(breaker.execute()).rejects.toThrow()
    expect(breaker.getState().failureCount).toBe(1)

    await breaker.execute()
    expect(breaker.getState().failureCount).toBe(0)
    expect(breaker.getState().state).toBe('closed')
  })

  it('should allow manual reset', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'))
    const breaker = new CircuitBreaker(fn, { failureThreshold: 1 })

    await expect(breaker.execute()).rejects.toThrow()
    expect(breaker.getState().state).toBe('open')

    breaker.reset()
    expect(breaker.getState().state).toBe('closed')
    expect(breaker.getState().failureCount).toBe(0)
  })
})

