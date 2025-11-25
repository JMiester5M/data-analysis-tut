import { promises as fs } from 'fs'
import { join } from 'path'

const DB_DIR = join(process.cwd(), 'data')
const DB_FILE = join(DB_DIR, 'db.json')

async function ensureDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true })
  } catch (e) {
    // ignore
  }
}

async function readDB() {
  try {
    await ensureDir()
    const content = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return { quality_history: [], recent_analyses: [] }
  }
}

async function writeDB(data) {
  try {
    await ensureDir()
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write DB:', e)
  }
}

export async function getQualityHistory({ fileName, limit = 200 } = {}) {
  const db = await readDB()
  let items = db.quality_history || []
  if (fileName) items = items.filter(i => i.fileName === fileName)
  // sort desc by ts
  items = items.sort((a, b) => (b.ts || 0) - (a.ts || 0))
  return items.slice(0, limit)
}

export async function addQualityHistory(entry) {
  const db = await readDB()
  const toInsert = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    ts: Date.now(),
    ...entry
  }
  db.quality_history = [toInsert, ...(db.quality_history || [])].slice(0, 5000)
  await writeDB(db)
  return toInsert
}

export async function getRecentAnalyses(limit = 5) {
  const db = await readDB()
  const items = db.recent_analyses || []
  return items.slice(0, limit)
}

export async function addRecentAnalysis(entry) {
  const db = await readDB()
  const next = [entry].concat(db.recent_analyses || [])
  // deduplicate by fileName keeping latest
  const seen = new Set()
  const dedup = []
  for (const it of next) {
    if (!seen.has(it.fileName)) {
      dedup.push(it)
      seen.add(it.fileName)
    }
  }
  db.recent_analyses = dedup.slice(0, 10)
  await writeDB(db)
  return entry
}

export default {
  getQualityHistory,
  addQualityHistory,
  getRecentAnalyses,
  addRecentAnalysis
}
