import { NextResponse } from 'next/server'
import { getQualityHistory, addQualityHistory } from '@/lib/db'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const fileName = url.searchParams.get('fileName') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '200', 10)
    const items = await getQualityHistory({ fileName, limit })
    return NextResponse.json({ items })
  } catch (err) {
    console.error('GET /api/quality-history failed', err)
    return NextResponse.json({ error: 'Failed to read quality history' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const saved = await addQualityHistory(body)
    return NextResponse.json({ ok: true, saved })
  } catch (err) {
    console.error('POST /api/quality-history failed', err)
    return NextResponse.json({ error: 'Failed to save quality history' }, { status: 500 })
  }
}
