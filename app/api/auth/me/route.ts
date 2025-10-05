import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/jwt'

export async function GET() {
  const cookie = (await cookies()).get(process.env.COOKIE_NAME || 'token')
  if (!cookie) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const payload: any = await verifyJwt(cookie.value)
    return NextResponse.json({ id: payload.id, name: payload.name, role: payload.role, email: payload.email })
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
}
