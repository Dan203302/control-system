import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/db/schema'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const data = await db.select().from(projects)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name || '').trim()
  const description = body.description ? String(body.description) : null
  if (!name) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const inserted = await db.insert(projects).values({ name, description }).returning()
  return NextResponse.json(inserted[0], { status: 201 })
}
