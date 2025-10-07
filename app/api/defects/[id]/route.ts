import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { defects, defectHistory, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'

const transitions: Record<string, string[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['review', 'cancelled'],
  review: ['closed', 'in_progress', 'cancelled'],
  closed: [],
  cancelled: []
}

function canEngineerEdit(sessionId: string, row: any) {
  return row.assigneeId === sessionId || row.creatorId === sessionId
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const rows = await db.select().from(defects).where(eq(defects.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = rows[0] as any
  let assigneeName: string | null = null
  if (row.assigneeId) {
    const u = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, row.assigneeId)).limit(1)
    assigneeName = u.length ? (u[0].fullName as string) : null
  }
  return NextResponse.json({ ...row, assigneeName })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const p = await params
  const id = Number(p.id)
  const existing = await db.select().from(defects).where(eq(defects.id, id)).limit(1)
  if (existing.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const row = existing[0]
  const isAdminManager = allowRoles(session, ['admin', 'manager'])
  const isEngineerAllowed = allowRoles(session, ['engineer']) && canEngineerEdit(session.id, row)
  if (!isAdminManager && !isEngineerAllowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const patch: any = {}
  const changes: Record<string, { from: any; to: any }> = {}
  if (body.title !== undefined) { patch.title = String(body.title); changes.title = { from: row.title, to: patch.title } }
  if (body.description !== undefined) { patch.description = body.description === null ? null : String(body.description); changes.description = { from: row.description, to: patch.description } }
  if (body.priority !== undefined) { patch.priority = String(body.priority); changes.priority = { from: row.priority, to: patch.priority } }
  if (body.projectId !== undefined) { patch.projectId = Number(body.projectId); changes.projectId = { from: row.projectId, to: patch.projectId } }
  if (body.objectId !== undefined) { patch.objectId = Number(body.objectId); changes.objectId = { from: row.objectId, to: patch.objectId } }
  if (body.stageId !== undefined) { patch.stageId = body.stageId === null ? null : Number(body.stageId); changes.stageId = { from: row.stageId, to: patch.stageId } }
  if (body.assigneeId !== undefined) { patch.assigneeId = body.assigneeId === null ? null : String(body.assigneeId); changes.assigneeId = { from: row.assigneeId, to: patch.assigneeId } }
  if (body.dueDate !== undefined) { patch.dueDate = body.dueDate === null ? null : new Date(body.dueDate); changes.dueDate = { from: row.dueDate, to: patch.dueDate } }
  if (body.status !== undefined) {
    const next = String(body.status)
    const allowed = transitions[row.status] || []
    if (!allowed.includes(next)) return NextResponse.json({ error: 'invalid_transition' }, { status: 400 })
    patch.status = next
    if (next === 'closed') patch.closedAt = new Date()
    changes.status = { from: row.status, to: next }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json(row)
  const updated = await db.update(defects).set(patch).where(eq(defects.id, id)).returning()
  if (updated.length) {
    const action = changes.status ? 'status_changed' : 'updated'
    await db.insert(defectHistory).values({ defectId: id, actorId: session.id, action, details: JSON.stringify({ changes }) })
  }
  return NextResponse.json(updated[0])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const p = await params
  const id = Number(p.id)
  const deleted = await db.delete(defects).where(eq(defects.id, id)).returning()
  if (!deleted.length) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.insert(defectHistory).values({ defectId: id, actorId: session.id, action: 'deleted' })
  return NextResponse.json({ ok: true })
}
