import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/jwt'
import { Card } from '@heroui/card'

export default async function Page() {
  const cookie = (await cookies()).get(process.env.COOKIE_NAME || 'token')
  if (!cookie) redirect('/login')
  let payload: any
  try {
    payload = await verifyJwt(cookie.value)
  } catch {
    redirect('/login')
  }
  const name = String(payload.name || '')
  const role = String(payload.role || '')
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <Card className="max-w-xl w-full p-6 text-center text-lg">Вы авторизованы под {name} и ролью {role}</Card>
    </div>
  )
}
