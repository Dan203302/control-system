import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/jwt'
import { db } from '@/lib/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const cookie = (await cookies()).get(process.env.COOKIE_NAME || 'token')
  if (!cookie) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const payload: any = await verifyJwt(cookie.value)
    const rows = await db
      .select({ id: users.id, name: users.fullName, email: users.email, role: roles.name, roleDescription: roles.description })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(eq(users.id, payload.id))
      .limit(1)
    if (!rows.length) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    return NextResponse.json(rows[0])
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
}
