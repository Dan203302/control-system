import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'
import { saveFile } from '@/lib/storage'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const defectId = Number(params.id)
  const items = await db.select().from(files).where(eq(files.defectId, defectId)).orderBy(asc(files.createdAt))
  return NextResponse.json(items)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager', 'engineer'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const defectId = Number(params.id)
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (file.size <= 0 || file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'too_large' }, { status: 400 })
  const meta = await saveFile(file, defectId)
  const inserted = await db.insert(files).values({ defectId, uploaderId: session.id, filename: meta.filename, storageKey: meta.storageKey, mimeType: meta.mime, sizeBytes: meta.size, checksumSha256: meta.checksum }).returning()
  return NextResponse.json(inserted[0], { status: 201 })
}
