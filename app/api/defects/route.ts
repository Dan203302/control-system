import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { defects, defectHistory, users } from '@/db/schema'
import { and, eq, sql, asc, desc } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

function toInt(v: string | null, d: number) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const page = toInt(url.searchParams.get('page'), 1)
  const limit = Math.min(toInt(url.searchParams.get('limit'), 20), 100)
  const offset = (page - 1) * limit
  const status = url.searchParams.get('status')
  const priority = url.searchParams.get('priority')
  const projectId = url.searchParams.get('projectId')
  const objectId = url.searchParams.get('objectId')
  const stageId = url.searchParams.get('stageId')
  const assigneeId = url.searchParams.get('assigneeId')
  const search = url.searchParams.get('q')
  const sortBy = url.searchParams.get('sortBy') || 'created_at'
  const sortDir = (url.searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const conditions = [] as any[]
  if (status) conditions.push(eq(defects.status, status))
  if (priority) conditions.push(eq(defects.priority, priority))
  if (projectId) conditions.push(eq(defects.projectId, Number(projectId)))
  if (objectId) conditions.push(eq(defects.objectId, Number(objectId)))
  if (stageId) conditions.push(eq(defects.stageId, Number(stageId)))
  if (assigneeId) conditions.push(eq(defects.assigneeId, assigneeId))
  if (search) conditions.push(sql`lower(${defects.title}) like ${'%' + search.toLowerCase() + '%'}`)
  const where = conditions.length ? and(...conditions) : undefined
  const order = sortBy === 'due_date' ? (sortDir === 'asc' ? asc(defects.dueDate) : desc(defects.dueDate)) : sortBy === 'priority' ? (sortDir === 'asc' ? asc(defects.priority) : desc(defects.priority)) : sortDir === 'asc' ? asc(defects.createdAt) : desc(defects.createdAt)
  const items = await db
    .select({
      id: defects.id,
      title: defects.title,
      status: defects.status,
      priority: defects.priority,
      projectId: defects.projectId,
      objectId: defects.objectId,
      stageId: defects.stageId,
      assigneeId: defects.assigneeId,
      assigneeName: users.fullName,
      dueDate: defects.dueDate,
      createdAt: defects.createdAt,
    })
    .from(defects)
    .leftJoin(users, eq(users.id, defects.assigneeId))
    .where(where as any)
    .orderBy(order)
    .limit(limit)
    .offset(offset)
  return NextResponse.json({ items, page, limit })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!allowRoles(session, ['admin', 'manager', 'engineer'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const title = String(body.title || '').trim()
  const description = body.description ? String(body.description) : null
  const priority = String(body.priority || 'medium')
  const projectId = Number(body.projectId)
  const objectId = Number(body.objectId)
  const stageId = body.stageId ? Number(body.stageId) : null
  const assigneeId = body.assigneeId ? String(body.assigneeId) : null
  const dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (!title || !projectId || !objectId) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const inserted = await db.insert(defects).values({ title, description, priority, projectId, objectId, stageId, assigneeId, creatorId: session.id, dueDate }).returning()
  if (inserted.length) {
    await db.insert(defectHistory).values({ defectId: inserted[0].id, actorId: session.id, action: 'created' })
  }
  return NextResponse.json(inserted[0], { status: 201 })
}
