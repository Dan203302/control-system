import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { getPath } from '@/lib/storage'
import fs from 'node:fs'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1)
  if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = rows[0]
  const path = getPath(row.storageKey)
  if (!fs.existsSync(path)) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const data = fs.readFileSync(path)
  return new Response(data, { headers: { 'Content-Type': row.mimeType, 'Content-Disposition': `attachment; filename="${row.filename}"` } })
}
