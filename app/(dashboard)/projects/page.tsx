"use client"
import { Card } from "@heroui/card"
import { Button } from "@heroui/button"

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Проекты</h1>
        <Button color="primary">Создать проект</Button>
      </div>
      <Card className="p-6">Список проектов будет здесь</Card>
    </div>
  )
}
