"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@heroui/card"
import { Chip } from "@heroui/chip"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"
import { Alert } from "@heroui/alert"
import { Spinner } from "@heroui/spinner"
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table"
import Link from "next/link"
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api"

type Defect = {
  id: number
  title: string
  description: string | null
  status: string
  priority: string
  projectId: number
  objectId: number
  stageId: number | null
  assigneeId: string | null
  creatorId: string
  dueDate: string | null
  closedAt: string | null
  createdAt: string
}

type Comment = {
  id: number
  defectId: number
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type FileRow = {
  id: number
  defectId: number
  uploaderId: string
  filename: string
  storageKey: string
  mimeType: string
  sizeBytes: number
  checksumSha256: string
  createdAt: string
}

type HistoryRow = {
  id: number
  defectId: number
  actorId: string | null
  action: string
  details: string | null
  createdAt: string
}

type Me = { id: string; role: string; email: string; name: string }
type UserOpt = { id: string; fullName: string; role: string }

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  review: "На проверке",
  closed: "Закрыта",
  cancelled: "Отменена",
}

const priorityOpts = [
  { key: "low", label: "Низкий" },
  { key: "medium", label: "Средний" },
  { key: "high", label: "Высокий" },
  { key: "urgent", label: "Срочный" },
]

const transitions: Record<string, string[]> = {
  new: ["in_progress", "cancelled"],
  in_progress: ["review", "cancelled"],
  review: ["closed", "in_progress", "cancelled"],
  closed: [],
  cancelled: [],
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
  const params = useParams()
  const id = Number(params.id)
  const [me, setMe] = useState<Me | null>(null)
  const [row, setRow] = useState<Defect | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [files, setFiles] = useState<FileRow[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState("medium")
  const [editAssignee, setEditAssignee] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [users, setUsers] = useState<UserOpt[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canManage = useMemo(() => {
    if (!me || !row) return false
    if (me.role === "admin" || me.role === "manager") return true
    if (me.role === "engineer" && (row.assigneeId === me.id || row.creatorId === me.id)) return true
    return false
  }, [me, row])

  async function loadAll() {
    setLoading(true)
    setError("")
    try {
      const [m, r] = await Promise.all([
        apiGet<Me>("/api/auth/me"),
        apiGet<Defect>(`/api/defects/${id}`),
      ])
      setMe(m)
      setRow(r)
      setEditTitle(r.title)
      setEditDescription(r.description || "")
      setEditPriority(r.priority)
      setEditAssignee(r.assigneeId || "")
      setEditDueDate(r.dueDate ? r.dueDate.slice(0, 10) : "")
      const [cs, fs, us] = await Promise.all([
        apiGet<Comment[]>(`/api/defects/${id}/comments`),
        apiGet<FileRow[]>(`/api/defects/${id}/files`),
        apiGet<UserOpt[]>(`/api/users`),
      ])
      setComments(cs)
      setFiles(fs)
      setUsers(us)
      const hs = await apiGet<HistoryRow[]>(`/api/defects/${id}/history`)
      setHistory(hs)
    } catch {
      setError("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (Number.isFinite(id)) loadAll()
  }, [id])

  async function changeStatus(next: string) {
    if (!row) return
    setSaving(true)
    setError("")
    try {
      const updated = await apiPatch<Defect>(`/api/defects/${row.id}`, { status: next })
      setRow(updated)
    } catch {
      setError("Не удалось изменить статус")
    } finally {
      setSaving(false)
    }
  }

  async function saveDetails() {
    if (!row) return
    setSaving(true)
    setError("")
    try {
      const payload: any = {
        title: editTitle,
        description: editDescription || null,
        priority: editPriority,
        assigneeId: editAssignee || null,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      }
      const updated = await apiPatch<Defect>(`/api/defects/${row.id}`, payload)
      setRow(updated)
    } catch {
      setError("Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  async function addComment() {
    if (!newComment.trim()) return
    setSaving(true)
    setError("")
    try {
      await apiPost(`/api/defects/${id}/comments`, { content: newComment.trim() })
      setNewComment("")
      const cs = await apiGet<Comment[]>(`/api/defects/${id}/comments`)
      setComments(cs)
    } catch {
      setError("Не удалось добавить комментарий")
    } finally {
      setSaving(false)
    }
  }

  async function startEdit(c: Comment) {
    setEditingId(c.id)
    setEditingContent(c.content)
  }

  async function saveComment(c: Comment) {
    setSaving(true)
    setError("")
    try {
      await apiPatch(`/api/comments/${c.id}`, { content: editingContent })
      setEditingId(null)
      const cs = await apiGet<Comment[]>(`/api/defects/${id}/comments`)
      setComments(cs)
    } catch {
      setError("Не удалось сохранить комментарий")
    } finally {
      setSaving(false)
    }
  }

  async function deleteComment(c: Comment) {
    setSaving(true)
    setError("")
    try {
      await apiDelete(`/api/comments/${c.id}`)
      const cs = await apiGet<Comment[]>(`/api/defects/${id}/comments`)
      setComments(cs)
    } catch {
      setError("Не удалось удалить комментарий")
    } finally {
      setSaving(false)
    }
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setSaving(true)
    setError("")
    try {
      const form = new FormData()
      form.append("file", f)
      const res = await fetch(`/api/defects/${id}/files`, { method: "POST", body: form })
      if (!res.ok) throw new Error()
      const fs = await apiGet<FileRow[]>(`/api/defects/${id}/files`)
      setFiles(fs)
    } catch {
      setError("Не удалось загрузить файл")
    } finally {
      setSaving(false)
      e.currentTarget.value = ""
    }
  }

  async function deleteFile(fr: FileRow) {
    setSaving(true)
    setError("")
    try {
      await apiDelete(`/api/files/${fr.id}`)
      const fs = await apiGet<FileRow[]>(`/api/defects/${id}/files`)
      setFiles(fs)
    } catch {
      setError("Не удалось удалить файл")
    } finally {
      setSaving(false)
    }
  }

  const nextStatuses = useMemo(() => (row ? transitions[row.status] || [] : []), [row])

  if (loading) return <div className="flex items-center justify-center p-10"><Spinner /></div>
  if (error) return <div className="p-4"><Alert color="danger" title={error} /></div>
  if (!row) return <div className="p-4"><Alert color="warning" title="Не найдено" /></div>

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-2xl font-semibold">Дефект #{row.id}</div>
          <Chip color={statusColor(row.status)} variant="flat">{statusLabels[row.status] || row.status}</Chip>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Заголовок" value={editTitle} onValueChange={setEditTitle} isDisabled={!canManage} />
          <Select label="Приоритет" selectedKeys={[editPriority]} onSelectionChange={(k) => setEditPriority(String(Array.from(k)[0] || "medium"))} isDisabled={!canManage}>
            {priorityOpts.map(p => <SelectItem key={p.key}>{p.label}</SelectItem>)}
          </Select>
          <Input label="Описание" value={editDescription} onValueChange={setEditDescription} isDisabled={!canManage} />
          <Select label="Исполнитель" selectedKeys={editAssignee ? [editAssignee] : []} onSelectionChange={(k) => setEditAssignee(String(Array.from(k)[0] || ""))} isDisabled={!canManage}>
            {users.map(u => <SelectItem key={u.id}>{u.fullName} ({u.role})</SelectItem>)}
          </Select>
          <Input type="date" label="Дедлайн" value={editDueDate} onValueChange={setEditDueDate} isDisabled={!canManage} />
          <Input isReadOnly label="Проект" value={String(row.projectId)} />
          <Input isReadOnly label="Объект" value={String(row.objectId)} />
          <Input isReadOnly label="Этап" value={row.stageId ? String(row.stageId) : ""} />
        </div>
        <div className="flex gap-2">
          <Button color="primary" isDisabled={!canManage || saving} onPress={saveDetails}>Сохранить</Button>
          {nextStatuses.map(s => (
            <Button key={s} variant="flat" isDisabled={!canManage || saving} onPress={() => changeStatus(s)}>{statusLabels[s] || s}</Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="text-lg font-semibold">Комментарии</div>
        <div className="flex gap-2 items-end">
          <Input label="Новый комментарий" value={newComment} onValueChange={setNewComment} className="flex-1" />
          <Button color="primary" isDisabled={saving || !newComment.trim()} onPress={addComment}>Добавить</Button>
        </div>
        <Table aria-label="comments">
          <TableHeader>
            <TableColumn>Автор</TableColumn>
            <TableColumn>Комментарий</TableColumn>
            <TableColumn>Создано</TableColumn>
            <TableColumn>Действия</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Нет комментариев" items={comments}>
            {(c: Comment) => (
              <TableRow key={c.id}>
                <TableCell className="truncate max-w-[200px]">{c.authorId}</TableCell>
                <TableCell>
                  {editingId === c.id ? (
                    <Input value={editingContent} onValueChange={setEditingContent} />
                  ) : (
                    c.content
                  )}
                </TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                <TableCell className="flex gap-2">
                  {editingId === c.id ? (
                    <>
                      <Button size="sm" color="primary" isDisabled={saving} onPress={() => saveComment(c)}>Сохранить</Button>
                      <Button size="sm" variant="flat" onPress={() => setEditingId(null)}>Отмена</Button>
                    </>
                  ) : (
                    <>
                      {(me?.id === c.authorId || me?.role === "admin" || me?.role === "manager") && (
                        <Button size="sm" variant="flat" onPress={() => startEdit(c)}>Изменить</Button>
                      )}
                      {(me?.id === c.authorId || me?.role === "admin" || me?.role === "manager") && (
                        <Button size="sm" color="danger" isDisabled={saving} onPress={() => deleteComment(c)}>Удалить</Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="text-lg font-semibold">Файлы</div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" onChange={onUploadFile} className="hidden" />
          <Button size="sm" color="primary" isDisabled={saving} onPress={() => fileInputRef.current?.click()}>Загрузить файл</Button>
        </div>
        <Table aria-label="files">
          <TableHeader>
            <TableColumn>Имя</TableColumn>
            <TableColumn>Размер</TableColumn>
            <TableColumn>Загружено</TableColumn>
            <TableColumn>Действия</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Нет файлов" items={files}>
            {(f: FileRow) => (
              <TableRow key={f.id}>
                <TableCell>{f.filename}</TableCell>
                <TableCell>{f.sizeBytes}</TableCell>
                <TableCell>{new Date(f.createdAt).toLocaleString()}</TableCell>
                <TableCell className="flex gap-2">
                  <Button as={Link} href={`/api/files/${f.id}/download`} size="sm" variant="flat">Скачать</Button>
                  {(me?.id === f.uploaderId || me?.role === "admin" || me?.role === "manager") && (
                    <Button size="sm" color="danger" isDisabled={saving} onPress={() => deleteFile(f)}>Удалить</Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="text-lg font-semibold">История изменений</div>
        <Table aria-label="history">
          <TableHeader>
            <TableColumn>Дата</TableColumn>
            <TableColumn>Действие</TableColumn>
            <TableColumn>Автор</TableColumn>
            <TableColumn>Детали</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Нет записей" items={history}>
            {(h: HistoryRow) => (
              <TableRow key={h.id}>
                <TableCell>{new Date(h.createdAt).toLocaleString()}</TableCell>
                <TableCell>{h.action}</TableCell>
                <TableCell className="truncate max-w-[200px]">{h.actorId || ""}</TableCell>
                <TableCell className="truncate max-w-[400px]">{h.details ? (h.details.length > 160 ? h.details.slice(0,160) + "…" : h.details) : ""}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
