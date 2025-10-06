import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comments } from '@/db/schema'
import { and, eq, isNull, asc } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const defectId = Number(p.id)
  const items = await db.select().from(comments).where(and(eq(comments.defectId, defectId), isNull(comments.deletedAt))).orderBy(asc(comments.createdAt))
  return NextResponse.json(items)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager', 'engineer'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const p = await params
  const defectId = Number(p.id)
  const body = await req.json()
  const content = String(body.content || '').trim()
  if (!content) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const inserted = await db.insert(comments).values({ defectId, authorId: session.id, content }).returning()
  return NextResponse.json(inserted[0], { status: 201 })
}
