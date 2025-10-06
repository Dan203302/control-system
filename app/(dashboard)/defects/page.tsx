"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@heroui/card"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import { Select, SelectItem } from "@heroui/select"
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table"
import { Spinner } from "@heroui/spinner"
import { Alert } from "@heroui/alert"
import { Chip } from "@heroui/chip"
import { apiGet } from "@/lib/api"

type Row = {
  id: number
  title: string
  status: string
  priority: string
  projectId: number
  objectId: number
  stageId: number | null
  assigneeId: string | null
  dueDate: string | null
  createdAt: string
}

type ListResponse = { items: Row[]; page: number; limit: number }

type Opt = { id: number; name: string }

const statuses = [
  { key: "new", label: "Новая" },
  { key: "in_progress", label: "В работе" },
  { key: "review", label: "На проверке" },
  { key: "closed", label: "Закрыта" },
  { key: "cancelled", label: "Отменена" },
]

const priorities = [
  { key: "low", label: "Низкий" },
  { key: "medium", label: "Средний" },
  { key: "high", label: "Высокий" },
  { key: "urgent", label: "Срочный" },
]

const sorts = [
  { key: "created_at", label: "Дата создания" },
  { key: "due_date", label: "Дедлайн" },
  { key: "priority", label: "Приоритет" },
]

const sortDirs = [
  { key: "desc", label: "По убыванию" },
  { key: "asc", label: "По возрастанию" },
]

export default function Page() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [priority, setPriority] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [objectId, setObjectId] = useState<number | null>(null)
  const [stageId, setStageId] = useState<number | null>(null)
  const [assigneeId, setAssigneeId] = useState<string>("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<Opt[]>([])
  const [objects, setObjects] = useState<Opt[]>([])
  const [stages, setStages] = useState<Opt[]>([])

  async function loadOptions() {
    try {
      const [p, o, s] = await Promise.all([
        apiGet<Opt[]>("/api/projects"),
        apiGet<Opt[]>("/api/objects"),
        apiGet<Opt[]>("/api/stages"),
      ])
      setProjects(p)
      setObjects(o)
      setStages(s)
    } catch {}
  }

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (status) sp.set("status", status)
    if (priority) sp.set("priority", priority)
    if (projectId) sp.set("projectId", String(projectId))
    if (objectId) sp.set("objectId", String(objectId))
    if (stageId) sp.set("stageId", String(stageId))
    if (assigneeId) sp.set("assigneeId", assigneeId)
    sp.set("sortBy", sortBy)
    sp.set("sortDir", sortDir)
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    return sp.toString()
  }, [q, status, priority, projectId, objectId, stageId, assigneeId, sortBy, sortDir, page, limit])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await apiGet<ListResponse>(`/api/defects?${params}`)
      setItems(res.items)
    } catch (e: any) {
      setError("Ошибка загрузки")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function resetFilters() {
    setQ("")
    setStatus(null)
    setPriority(null)
    setProjectId(null)
    setObjectId(null)
    setStageId(null)
    setAssigneeId("")
    setSortBy("created_at")
    setSortDir("desc")
    setLimit(10)
    setPage(1)
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    load()
  }, [params])

  function statusColor(v: string) {
    if (v === "new") return "warning"
    if (v === "in_progress") return "primary"
    if (v === "review") return "secondary"
    if (v === "closed") return "success"
    if (v === "cancelled") return "danger"
    return "default"
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Input placeholder="Поиск" value={q} onValueChange={setQ} />
          <Select selectedKeys={status ? [status] : []} onSelectionChange={(k) => setStatus(Array.from(k)[0] as string || null)} labelPlacement="inside" placeholder="Статус">
            {statuses.map(s => <SelectItem key={s.key}>{s.label}</SelectItem>)}
          </Select>
          <Select selectedKeys={priority ? [priority] : []} onSelectionChange={(k) => setPriority(Array.from(k)[0] as string || null)} labelPlacement="inside" placeholder="Приоритет">
            {priorities.map(s => <SelectItem key={s.key}>{s.label}</SelectItem>)}
          </Select>
          <Select selectedKeys={projectId ? [String(projectId)] : []} onSelectionChange={(k) => setProjectId(Number(Array.from(k)[0] || 0) || null)} labelPlacement="inside" placeholder="Проект">
            {projects.map(p => <SelectItem key={p.id}>{p.name}</SelectItem>)}
          </Select>
          <Select selectedKeys={objectId ? [String(objectId)] : []} onSelectionChange={(k) => setObjectId(Number(Array.from(k)[0] || 0) || null)} labelPlacement="inside" placeholder="Объект">
            {objects.map(o => <SelectItem key={o.id}>{o.name}</SelectItem>)}
          </Select>
          <Select selectedKeys={stageId ? [String(stageId)] : []} onSelectionChange={(k) => setStageId(Number(Array.from(k)[0] || 0) || null)} labelPlacement="inside" placeholder="Этап">
            {stages.map(s => <SelectItem key={s.id}>{s.name}</SelectItem>)}
          </Select>
          <Input placeholder="Исполнитель ID" value={assigneeId} onValueChange={setAssigneeId} />
          <Select selectedKeys={[sortBy]} onSelectionChange={(k) => setSortBy(String(Array.from(k)[0] || "created_at"))} labelPlacement="inside" placeholder="Сортировка">
            {sorts.map(s => <SelectItem key={s.key}>{s.label}</SelectItem>)}
          </Select>
          <Select selectedKeys={[sortDir]} onSelectionChange={(k) => setSortDir(String(Array.from(k)[0] || "desc"))} labelPlacement="inside" placeholder="Порядок">
            {sortDirs.map(s => <SelectItem key={s.key}>{s.label}</SelectItem>)}
          </Select>
          <Select selectedKeys={[String(limit)]} onSelectionChange={(k) => setLimit(Number(Array.from(k)[0] || 10))} labelPlacement="inside" placeholder="На странице">
            {[10,20,50,100].map(n => <SelectItem key={n}>{String(n)}</SelectItem>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button color="primary" onPress={() => { setPage(1); load() }}>Найти</Button>
          <Button variant="flat" onPress={resetFilters}>Сбросить</Button>
        </div>
      </Card>

      {error && <Alert color="danger" title={error} />}

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10"><Spinner /></div>
        ) : (
          <Table aria-label="defects">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Заголовок</TableColumn>
              <TableColumn>Статус</TableColumn>
              <TableColumn>Приоритет</TableColumn>
              <TableColumn>Проект</TableColumn>
              <TableColumn>Объект</TableColumn>
              <TableColumn>Этап</TableColumn>
              <TableColumn>Исполнитель</TableColumn>
              <TableColumn>Дедлайн</TableColumn>
              <TableColumn>Создано</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет данных" items={items}>
              {(item: Row) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell><Chip color={statusColor(item.status)} size="sm" variant="flat">{item.status}</Chip></TableCell>
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{item.projectId}</TableCell>
                  <TableCell>{item.objectId}</TableCell>
                  <TableCell>{item.stageId ?? ""}</TableCell>
                  <TableCell className="truncate max-w-[160px]">{item.assigneeId ?? ""}</TableCell>
                  <TableCell>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : ""}</TableCell>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-default-500">Стр. {page}</div>
        <div className="flex gap-2">
          <Button variant="flat" isDisabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))}>Назад</Button>
          <Button variant="flat" isDisabled={items.length < limit} onPress={() => setPage(p => p + 1)}>Вперёд</Button>
        </div>
      </div>
    </div>
  )
}
