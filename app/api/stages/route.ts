import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stages } from '@/db/schema'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const data = await db.select().from(stages)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name || '').trim()
  const objectId = Number(body.objectId)
  if (!name || !objectId) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const inserted = await db.insert(stages).values({ name, objectId }).returning()
  return NextResponse.json(inserted[0], { status: 201 })
}
