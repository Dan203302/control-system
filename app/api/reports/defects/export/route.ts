import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { defects } from '@/db/schema'
import { and, eq, sql, desc, asc } from 'drizzle-orm'
import { getSession, allowRoles } from '@/lib/auth'
import ExcelJS from 'exceljs'

export const runtime = 'nodejs'

function toInt(v: string | null, d: number) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || !allowRoles(session, ['admin', 'manager', 'observer'])) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const url = new URL(req.url)
  const format = (url.searchParams.get('format') || 'csv').toLowerCase()
  const page = toInt(url.searchParams.get('page'), 1)
  const limit = Math.min(toInt(url.searchParams.get('limit'), 1000), 5000)
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
  const rows = await db.select({
    id: defects.id,
    title: defects.title,
    status: defects.status,
    priority: defects.priority,
    projectId: defects.projectId,
    objectId: defects.objectId,
    stageId: defects.stageId,
    assigneeId: defects.assigneeId,
    creatorId: defects.creatorId,
    dueDate: defects.dueDate,
    closedAt: defects.closedAt,
    createdAt: defects.createdAt,
  }).from(defects).where(where as any).orderBy(order).limit(limit).offset(offset)
  const headers = ['id','title','status','priority','projectId','objectId','stageId','assigneeId','creatorId','dueDate','closedAt','createdAt']
  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('defects')
    ws.addRow(headers)
    for (const r of rows) {
      ws.addRow([
        r.id,
        r.title,
        r.status,
        r.priority,
        r.projectId,
        r.objectId,
        r.stageId ?? '',
        r.assigneeId ?? '',
        r.creatorId,
        r.dueDate ? new Date(r.dueDate) : '',
        r.closedAt ? new Date(r.closedAt) : '',
        r.createdAt ? new Date(r.createdAt) : ''
      ])
    }
    const buffer = await wb.xlsx.writeBuffer()
    const data = new Uint8Array(buffer)
    const name = `defects_${new Date().toISOString()}.xlsx`
    return new Response(data, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"` } })
  } else {
    const lines = [headers.join(',')]
    for (const r of rows) {
      const line = [r.id, r.title, r.status, r.priority, r.projectId, r.objectId, r.stageId ?? '', r.assigneeId ?? '', r.creatorId, r.dueDate ? new Date(r.dueDate).toISOString() : '', r.closedAt ? new Date(r.closedAt).toISOString() : '', r.createdAt ? new Date(r.createdAt).toISOString() : '']
      lines.push(line.map(v => typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : String(v)).join(','))
    }
    const csv = lines.join('\n')
    const name = `defects_${new Date().toISOString()}.csv`
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` } })
  }
}
