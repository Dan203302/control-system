import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || '')

export async function signJwt(payload: Record<string, any>, expiresIn?: string) {
  const exp = expiresIn || process.env.JWT_EXPIRES || '7d'
  return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(exp).sign(secret)
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as any
}
