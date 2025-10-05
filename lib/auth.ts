import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/jwt'
import { NextResponse } from 'next/server'
import { hasRole, Role } from '@/lib/rbac'

export async function getSession() {
  const cookie = (await cookies()).get(process.env.COOKIE_NAME || 'token')
  if (!cookie) return null
  try {
    const payload: any = await verifyJwt(cookie.value)
    return payload
  } catch {
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return session
}

export function allowRoles(session: any, roles: Role | Role[]) {
  if (!session) return false
  return hasRole(session.role, roles)
}
