import OpenAI from 'openai'
import { CV_PARSING_SCHEMA } from './openai-schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function parseCVWithSchema(extractedText: string) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06'

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Du bist ein Experte für CV-Parsing. Extrahiere strukturierte Informationen. Antworte NUR mit validem JSON gemäß Schema.',
      },
      {
        role: 'user',
        content: `Bitte parse folgenden Lebenslauf und extrahiere alle relevanten Informationen:\n\n${extractedText}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'cv_parsing',
        strict: true,
        schema: CV_PARSING_SCHEMA as any,
      },
    },
    temperature: 0.1,
    max_tokens: 4000,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Keine Antwort von OpenAI erhalten')
  return JSON.parse(content)
}


