import { NextResponse } from 'next/server'
import { openAIClient } from '@/lib/openai-client'
import { config } from '@/lib/config'

export async function GET() {
  const checks: Record<string, boolean | string> = {
    server: true,
    timestamp: new Date().toISOString(),
  }

  try {
    // OpenAI-API-Check
    const openAIHealthy = await openAIClient.healthCheck()
    checks.openai = openAIHealthy
    checks.openai_model = config.OPENAI_MODEL
  } catch (error) {
    checks.openai = false
    checks.openai_error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Environment-Check
  checks.environment = config.NODE_ENV
  checks.has_api_key = !!config.OPENAI_API_KEY && config.OPENAI_API_KEY.length > 0
  checks.has_background_agent_key = !!config.BACKGROUND_AGENT_KEY

  // Gesamt-Status
  const isHealthy = checks.server && checks.openai === true
  const status = isHealthy ? 'healthy' : 'degraded'

  return NextResponse.json(
    { status, checks },
    { status: isHealthy ? 200 : 503 }
  )
}


