"use client"
import { Card } from "@heroui/card"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Поиск дефектов" className="max-w-xl"/>
        <Button color="primary">Найти</Button>
      </div>
      <Card className="p-6">Список дефектов будет здесь</Card>
    </div>
  )
}
