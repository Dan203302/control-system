import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comments } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const rows = await db.select().from(comments).where(and(eq(comments.id, id), isNull(comments.deletedAt))).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1)
  if (!rows.length || rows[0].deletedAt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = rows[0]
  const can = session.id === row.authorId || allowRoles(session, ['admin', 'manager'])
  if (!can) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const content = String(body.content || '').trim()
  if (!content) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const updated = await db.update(comments).set({ content, updatedAt: new Date() }).where(eq(comments.id, id)).returning()
  return NextResponse.json(updated[0])
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1)
  if (!rows.length || rows[0].deletedAt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = rows[0]
  const can = session.id === row.authorId || allowRoles(session, ['admin', 'manager'])
  if (!can) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const updated = await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id)).returning()
  return NextResponse.json({ ok: true })
}
