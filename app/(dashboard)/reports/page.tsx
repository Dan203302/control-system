"use client"
import { Card } from "@heroui/card"
import { Button } from "@heroui/button"
import Link from "next/link"

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Отчёты</h1>
      <div className="flex items-center gap-2">
        <Button as={Link} href="/api/reports/defects/export?format=csv" color="primary">Экспорт CSV</Button>
        <Button as={Link} href="/api/reports/defects/export?format=xlsx" color="secondary">Экспорт Excel</Button>
        <Button as={Link} href="/api/reports/stats" variant="flat">Статистика</Button>
      </div>
      <Card className="p-6">Здесь будут графики и статистика</Card>
    </div>
  )
}
