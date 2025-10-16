import '@testing-library/jest-dom/vitest'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup nach jedem Test
afterEach(() => {
  cleanup()
})

// Environment Variables für Tests
process.env.OPENAI_API_KEY = 'sk-test-key-for-testing'
process.env.NODE_ENV = 'test'
process.env.OPENAI_MODEL = 'gpt-4o-mini'

// Mock für Next.js Image-Komponente
vi.mock('next/image', () => ({
  default: (props: any) => props,
}))

// Mock für dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    return fn().then((mod: any) => mod.default || mod)
  },
}))

