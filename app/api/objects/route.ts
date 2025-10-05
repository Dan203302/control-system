import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { objects } from '@/db/schema'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const data = await db.select().from(objects)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name || '').trim()
  const address = body.address ? String(body.address) : null
  const projectId = Number(body.projectId)
  if (!name || !projectId) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const inserted = await db.insert(objects).values({ name, address, projectId }).returning()
  return NextResponse.json(inserted[0], { status: 201 })
}
