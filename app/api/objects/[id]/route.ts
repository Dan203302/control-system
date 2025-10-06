import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { objects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const rows = await db.select().from(objects).where(eq(objects.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const p = await params
  const id = Number(p.id)
  const body = await req.json()
  const name = body.name !== undefined ? String(body.name) : undefined
  const address = body.address !== undefined ? String(body.address) : undefined
  const updated = await db.update(objects).set({ ...(name !== undefined ? { name } : {}), ...(address !== undefined ? { address } : {}) }).where(eq(objects.id, id)).returning()
  if (updated.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(updated[0])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const p = await params
  const id = Number(p.id)
  const deleted = await db.delete(objects).where(eq(objects.id, id)).returning()
  if (deleted.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
