import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const body = await req.json()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (exists.length > 0) {
    return NextResponse.json({ error: 'exists' }, { status: 409 })
  }
  await db.insert(roles).values([{ name: 'admin' }, { name: 'manager' }, { name: 'engineer' }, { name: 'observer' }]).onConflictDoNothing()
  const engineer = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'engineer')).limit(1)
  if (engineer.length === 0) {
    return NextResponse.json({ error: 'role' }, { status: 500 })
  }
  const hash = await bcrypt.hash(password, 10)
  await db.insert(users).values({ email, passwordHash: hash, fullName, roleId: engineer[0].id })
  return NextResponse.json({ ok: true }, { status: 201 })
}
