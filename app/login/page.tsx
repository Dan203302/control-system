"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@heroui/card'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Alert } from '@heroui/alert'
import Link from 'next/link'

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    setLoading(false)
    if (!res.ok) {
      setError('Неверные данные')
      return
    }
    router.push('/me')
  }
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input type="email" label="Email" value={email} onValueChange={setEmail} isRequired/>
          <Input type="password" label="Пароль" value={password} onValueChange={setPassword} isRequired/>
          {error && <Alert color="danger" title={error} />}
          <Button color="primary" type="submit" isLoading={loading} className="w-full">Войти</Button>
        </form>
        <div className="text-center text-sm text-default-500">
          Нет аккаунта? <Button as={Link} href="/register" size="sm" variant="light">Зарегистрироваться</Button>
        </div>
      </Card>
    </div>
  )
}
