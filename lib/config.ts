import { EnvironmentSchema, type Environment } from './schemas'

/**
 * Validiert und exportiert typsichere Environment-Variablen
 * Wirft einen Fehler beim App-Start, wenn kritische Variablen fehlen
 */
function validateEnvironment(): Environment {
  try {
    const env = EnvironmentSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      NODE_ENV: process.env.NODE_ENV,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
    })

    // Zusätzliche Runtime-Validierung
    if (env.NODE_ENV === 'production' && !env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY ist in Production zwingend erforderlich')
    }

    return env
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Environment-Validierung fehlgeschlagen:')
      console.error(error.message)
      
      // In Development: Hilfreiche Hinweise
      if (process.env.NODE_ENV !== 'production') {
        console.error('\n💡 Tipp: Erstelle eine .env.local Datei mit:')
        console.error('   OPENAI_API_KEY=sk-your-key-here')
        console.error('   NODE_ENV=development\n')
      }
    }
    throw error
  }
}

// Singleton-Pattern: Validierung nur einmal durchführen
let cachedConfig: Environment | null = null

export function getConfig(): Environment {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment()
  }
  return cachedConfig
}

// Default-Export für einfachen Import
export const config = getConfig()

// Helper-Funktionen
export const isProduction = () => config.NODE_ENV === 'production'
export const isDevelopment = () => config.NODE_ENV === 'development'
export const isTest = () => config.NODE_ENV === 'test'

