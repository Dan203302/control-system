"use client"
import { useEffect, useState } from "react"
import { Card } from "@heroui/card"
import { Button } from "@heroui/button"
import { Alert } from "@heroui/alert"
import { Spinner } from "@heroui/spinner"
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table"
import { Chip } from "@heroui/chip"
import Link from "next/link"
import { apiGet } from "@/lib/api"

type Stats = {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  overdue: number
  byProject: Record<string, number>
}

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  review: "На проверке",
  closed: "Закрыта",
  cancelled: "Отменена",
}

function statusColor(v: string) {
  if (v === "new") return "warning"
  if (v === "in_progress") return "primary"
  if (v === "review") return "secondary"
  if (v === "closed") return "success"
  if (v === "cancelled") return "danger"
  return "default"
}

export default function Page() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const s = await apiGet<Stats>("/api/reports/stats")
      setStats(s)
    } catch {
      setError("Ошибка загрузки статистики")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Отчёты</h1>
      <div className="flex items-center gap-2">
        <Button as={Link} href="/api/reports/defects/export?format=csv" color="primary">Экспорт CSV</Button>
        <Button as={Link} href="/api/reports/defects/export?format=xlsx" color="secondary">Экспорт Excel</Button>
        <Button variant="flat" onPress={load}>Обновить</Button>
      </div>

      {error && <Alert color="danger" title={error} />}

      {loading ? (
        <div className="flex items-center justify-center p-10"><Spinner /></div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="text-sm text-default-500">Всего дефектов</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-default-500">Просрочено</div>
              <div className="text-2xl font-semibold">{stats.overdue}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="font-semibold mb-3">По статусу</div>
              <Table removeWrapper aria-label="by-status">
                <TableHeader>
                  <TableColumn>Статус</TableColumn>
                  <TableColumn>Кол-во</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Нет данных" items={Object.entries(stats.byStatus)}>
                  {(row: [string, number]) => (
                    <TableRow key={row[0]}>
                      <TableCell><Chip size="sm" color={statusColor(row[0])} variant="flat">{statusLabels[row[0]] || row[0]}</Chip></TableCell>
                      <TableCell>{row[1]}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4">
              <div className="font-semibold mb-3">По приоритету</div>
              <Table removeWrapper aria-label="by-priority">
                <TableHeader>
                  <TableColumn>Приоритет</TableColumn>
                  <TableColumn>Кол-во</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Нет данных" items={Object.entries(stats.byPriority)}>
                  {(row: [string, number]) => (
                    <TableRow key={row[0]}>
                      <TableCell>{row[0]}</TableCell>
                      <TableCell>{row[1]}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4">
              <div className="font-semibold mb-3">По проекту</div>
              <Table removeWrapper aria-label="by-project">
                <TableHeader>
                  <TableColumn>Проект ID</TableColumn>
                  <TableColumn>Кол-во</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Нет данных" items={Object.entries(stats.byProject)}>
                  {(row: [string, number]) => (
                    <TableRow key={row[0]}>
                      <TableCell>{row[0]}</TableCell>
                      <TableCell>{row[1]}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-6">Нет данных</Card>
      )}
    </div>
  )
}
