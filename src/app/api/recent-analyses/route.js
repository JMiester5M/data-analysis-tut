import { NextResponse } from 'next/server'
import { getRecentAnalyses, addRecentAnalysis } from '@/lib/db'

export async function GET() {
  try {
    const items = await getRecentAnalyses(5)
    return NextResponse.json({ items })
  } catch (err) {
    console.error('GET /api/recent-analyses failed', err)
    return NextResponse.json({ error: 'Failed to read recent analyses' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const saved = await addRecentAnalysis(body)
    return NextResponse.json({ ok: true, saved })
  } catch (err) {
    console.error('POST /api/recent-analyses failed', err)
    return NextResponse.json({ error: 'Failed to save recent analysis' }, { status: 500 })
  }
}
