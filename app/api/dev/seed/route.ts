import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { roles, users, projects, objects, stages, defects, comments, defectHistory } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

function isAllowed(req: Request) {
  // Allow in non-production. In production require SEED_TOKEN and Authorization header or ?token
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) return true
  const token = process.env.SEED_TOKEN || ''
  if (!token) return false
  const url = new URL(req.url)
  const qp = url.searchParams.get('token')
  const auth = req.headers.get('authorization') || ''
  const fromHeader = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : ''
  return qp === token || fromHeader === token
}

export async function POST(req: Request) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 1) Roles
  const roleNames = ['admin', 'manager', 'engineer', 'observer'] as const
  await db.insert(roles).values(roleNames.map((name) => ({ name }))).onConflictDoNothing()
  const roleRows = await db.select().from(roles)
  const byName: Record<string, number> = {}
  for (const r of roleRows) byName[r.name] = r.id

  // 2) Users
  const creds = [
    { email: 'admin@demo.local', fullName: 'Администратор', role: 'admin' },
    { email: 'manager@demo.local', fullName: 'Менеджер', role: 'manager' },
    { email: 'engineer@demo.local', fullName: 'Инженер', role: 'engineer' },
    { email: 'observer@demo.local', fullName: 'Наблюдатель', role: 'observer' },
  ]
  const password = 'demo1234'
  const hash = await bcrypt.hash(password, 10)
  for (const c of creds) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, c.email)).limit(1)
    if (existing.length === 0) {
      await db.insert(users).values({
        email: c.email,
        fullName: c.fullName,
        roleId: byName[c.role]!,
        passwordHash: hash,
      }).onConflictDoNothing()
    }
  }
  const allUsers = await db.select().from(users)
  const admin = allUsers.find((u) => u.email === 'admin@demo.local')!
  const manager = allUsers.find((u) => u.email === 'manager@demo.local')!
  const engineer = allUsers.find((u) => u.email === 'engineer@demo.local')!
  const observer = allUsers.find((u) => u.email === 'observer@demo.local')!

  // 3) Projects
  await db.insert(projects).values([
    { name: 'Demo Project A', description: 'Пилотный проект' },
    { name: 'Demo Project B', description: 'Второй проект' },
  ]).onConflictDoNothing()
  const prjs = await db.select().from(projects)
  const prjA = prjs.find((p) => p.name === 'Demo Project A') || prjs[0]
  const prjB = prjs.find((p) => p.name === 'Demo Project B') || prjs[1] || prjs[0]

  // 4) Objects
  await db.insert(objects).values([
    { name: 'Корпус А', address: 'ул. Первая, 1', projectId: prjA.id },
    { name: 'Корпус Б', address: 'ул. Вторая, 2', projectId: prjA.id },
    { name: 'Склад-1', address: 'пр. Складской, 10', projectId: prjB.id },
  ]).onConflictDoNothing()
  const objs = await db.select().from(objects)
  const objA = objs.find((o) => o.name === 'Корпус А') || objs[0]
  const objB = objs.find((o) => o.name === 'Корпус Б') || objs[1] || objs[0]

  // 5) Stages
  await db.insert(stages).values([
    { name: 'Фундамент', objectId: objA.id },
    { name: 'Каркас', objectId: objA.id },
    { name: 'Отделка', objectId: objB.id },
  ]).onConflictDoNothing()
  const stgs = await db.select().from(stages)
  const stFund = stgs.find((s) => s.name === 'Фундамент') || stgs[0]
  const stKarkas = stgs.find((s) => s.name === 'Каркас') || stgs[1] || stgs[0]

  // 6) Defects
  const now = new Date()
  const plus = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  await db.insert(defects).values([
    {
      title: 'Трещина в фундаменте',
      description: 'Обнаружена трещина в блоке F-12',
      status: 'new',
      priority: 'high',
      projectId: prjA.id,
      objectId: objA.id,
      stageId: stFund.id,
      assigneeId: engineer.id,
      creatorId: manager.id,
      dueDate: plus(7),
    },
    {
      title: 'Неровная геометрия каркаса',
      description: 'Отклонение по вертикали 6 мм',
      status: 'in_progress',
      priority: 'medium',
      projectId: prjA.id,
      objectId: objA.id,
      stageId: stKarkas.id,
      assigneeId: engineer.id,
      creatorId: manager.id,
      dueDate: plus(3),
    },
    {
      title: 'Отсутствует маркировка на складе',
      description: 'Полки без бирок',
      status: 'review',
      priority: 'low',
      projectId: prjB.id,
      objectId: objs.find((o) => o.name === 'Склад-1')!.id,
      stageId: null,
      assigneeId: manager.id,
      creatorId: admin.id,
      dueDate: plus(10),
    },
  ]).onConflictDoNothing()

  const defRows = await db.select().from(defects)
  const d1 = defRows.find((d) => d.title === 'Трещина в фундаменте') || defRows[0]
  const d2 = defRows.find((d) => d.title === 'Неровная геометрия каркаса') || defRows[1] || defRows[0]

  // 7) Comments
  await db.insert(comments).values([
    { defectId: d1.id, authorId: manager.id, content: 'Проверить на предмет роста трещины' },
    { defectId: d1.id, authorId: engineer.id, content: 'Заказал дополнительную экспертизу' },
    { defectId: d2.id, authorId: engineer.id, content: 'Работаю над исправлением' },
  ]).onConflictDoNothing()

  // 8) History
  await db.insert(defectHistory).values([
    { defectId: d1.id, actorId: manager.id, action: 'create', details: 'Создан дефект' },
    { defectId: d1.id, actorId: engineer.id, action: 'assign', details: 'Назначен исполнитель' },
    { defectId: d2.id, actorId: engineer.id, action: 'status', details: 'Статус: in_progress' },
  ]).onConflictDoNothing()

  return NextResponse.json({
    ok: true,
    users: creds.map((c) => ({ email: c.email, password })),
    projects: [prjA.name, prjB.name],
    defects: defRows.slice(0, 5).map((d) => ({ id: d.id, title: d.title, status: d.status })),
  })
}

export async function GET(req: Request) {
  // alias to POST for convenience
  return POST(req)
}
