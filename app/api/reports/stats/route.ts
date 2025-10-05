import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { defects } from '@/db/schema'
import { sql, and, ne, lt, isNull } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager', 'observer'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const now = new Date()
  const total = await db.select({ c: sql<number>`count(*)` }).from(defects)
  const byStatus = await db.select({ k: defects.status, c: sql<number>`count(*)` }).from(defects).groupBy(defects.status)
  const byPriority = await db.select({ k: defects.priority, c: sql<number>`count(*)` }).from(defects).groupBy(defects.priority)
  const overdue = await db.select({ c: sql<number>`count(*)` }).from(defects).where(and(ne(defects.status, 'closed'), ne(defects.status, 'cancelled'), isNull(defects.closedAt), lt(defects.dueDate, now)))
  const byProject = await db.select({ k: defects.projectId, c: sql<number>`count(*)` }).from(defects).groupBy(defects.projectId)
  const payload = {
    total: total[0]?.c || 0,
    byStatus: Object.fromEntries(byStatus.map(r => [String(r.k), Number(r.c)])),
    byPriority: Object.fromEntries(byPriority.map(r => [String(r.k), Number(r.c)])),
    overdue: overdue[0]?.c || 0,
    byProject: Object.fromEntries(byProject.map(r => [String(r.k), Number(r.c)])),
  }
  return NextResponse.json(payload)
}
