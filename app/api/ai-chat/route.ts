import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, model } = body || {}

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OPENROUTER_API_KEY' }, { status: 500 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'ALLOCON',
      },
      body: JSON.stringify({
        model: model || 'deepseek/deepseek-r1-0528:free',
        messages,
      }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected server error' }, { status: 500 })
  }
}
