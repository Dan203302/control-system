import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, roles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length === 0) {
    await db.insert(roles).values([{ name: 'admin' }, { name: 'manager' }, { name: 'user' }]).onConflictDoNothing();
    const admin = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'admin')).limit(1);
    const hash = await bcrypt.hash(password, 10);
    if (admin.length > 0) {
      await db.insert(users).values({ email, passwordHash: hash, fullName: 'Администратор', roleId: admin[0].id }).onConflictDoNothing();
    }
  }
  const found = await db
    .select({ id: users.id, fullName: users.fullName, passwordHash: users.passwordHash, role: roles.name })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(and(eq(users.isActive, true), sql`lower(${users.email}) = lower(${email})`))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const user = found[0];
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const token = await signJwt({ id: user.id, name: user.fullName, role: user.role, email });
  const res = NextResponse.json({ ok: true });
  const maxAge = 60 * 60 * 24 * 7;
  res.cookies.set({ name: process.env.COOKIE_NAME || 'token', value: token, httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge });
  return res;
}
