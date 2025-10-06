import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { defectHistory } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const rows = await db.select().from(defectHistory).where(eq(defectHistory.defectId, id)).orderBy(desc(defectHistory.createdAt))
  return NextResponse.json(rows)
}
