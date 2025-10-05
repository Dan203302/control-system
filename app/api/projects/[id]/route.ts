import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = Number(params.id)
  const body = await req.json()
  const name = body.name !== undefined ? String(body.name) : undefined
  const description = body.description !== undefined ? String(body.description) : undefined
  const updated = await db.update(projects).set({ ...(name !== undefined ? { name } : {}), ...(description !== undefined ? { description } : {}) }).where(eq(projects.id, id)).returning()
  if (updated.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(updated[0])
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = Number(params.id)
  const deleted = await db.delete(projects).where(eq(projects.id, id)).returning()
  if (deleted.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
