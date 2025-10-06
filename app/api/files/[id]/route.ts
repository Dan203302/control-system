import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'
import { getPath } from '@/lib/storage'
import fs from 'node:fs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1)
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1)
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = rows[0]
  const can = allowRoles(session, ['admin', 'manager']) || session.id === row.uploaderId
  if (!can) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const path = getPath(row.storageKey)
  try {
    if (fs.existsSync(path)) fs.unlinkSync(path)
  } catch {}
  await db.delete(files).where(eq(files.id, id))
  return NextResponse.json({ ok: true })
}
