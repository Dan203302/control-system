import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, roles } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const rows = await db
    .select({ id: users.id, fullName: users.fullName, roleId: users.roleId, role: roles.name })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
  return NextResponse.json(rows)
}
