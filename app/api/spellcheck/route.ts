import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string') return NextResponse.json({ warning: null })
    // sehr leichte Heuristik als Fallback (keine externen APIs)
    const longWords = (text.match(/\b\w{32,}\b/g) || []).length
    const doubleSpaces = /\s{2,}/.test(text)
    let warning = ''
    if (longWords > 0) warning += `Sehr lange Wörter gefunden (${longWords}). `
    if (doubleSpaces) warning += 'Doppelte Leerzeichen gefunden. '
    return NextResponse.json({ warning: warning || null })
  } catch {
    return NextResponse.json({ warning: null })
  }
}


