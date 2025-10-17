import { EnvironmentSchema, type Environment } from './schemas'

// Prüfe ob wir im Build-Prozess sind
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

/**
 * Validiert und exportiert typsichere Environment-Variablen
 * Wirft einen Fehler beim App-Start, wenn kritische Variablen fehlen
 * Im Build-Prozess werden fehlende Variablen erlaubt
 */
function validateEnvironment(): Environment {
  // Im Build-Prozess: Verwende Dummy-Werte wenn nicht gesetzt
  // WICHTIG: Zur Runtime IMMER echten Key verwenden!
  const apiKey = isBuildTime && !process.env.OPENAI_API_KEY
    ? 'sk-build-dummy'
    : process.env.OPENAI_API_KEY
  
  try {
    const env = EnvironmentSchema.parse({
      OPENAI_API_KEY: apiKey,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      NODE_ENV: process.env.NODE_ENV,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
      BACKGROUND_AGENT_KEY: process.env.BACKGROUND_AGENT_KEY,
    })

    // Runtime-Validierung nur wenn NICHT im Build-Prozess
    if (!isBuildTime && env.NODE_ENV === 'production' && !process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY ist in Production zwingend erforderlich')
    }

    return env
  } catch (error) {
    // Im Build-Prozess: Warnungen statt Errors
    if (isBuildTime) {
      console.warn('⚠️ Environment-Validierung übersprungen (Build-Zeit)')
      return {
        OPENAI_API_KEY: 'sk-build-dummy',
        OPENAI_MODEL: 'gpt-4o',
        NODE_ENV: (process.env.NODE_ENV as any) || 'production',
        PUPPETEER_EXECUTABLE_PATH: undefined,
        BACKGROUND_AGENT_KEY: undefined,
      }
    }
    
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

