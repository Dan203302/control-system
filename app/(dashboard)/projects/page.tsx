"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@heroui/card"
import { Button } from "@heroui/button"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal"
import { Input } from "@heroui/input"
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table"
import { Alert } from "@heroui/alert"
import { Spinner } from "@heroui/spinner"
import { apiGet, apiPost } from "@/lib/api"

type Project = { id: number; name: string; description: string | null; createdAt: string }
type Me = { id: string; name: string; email: string; role: string }

export default function Page() {
  const [me, setMe] = useState<Me | null>(null)
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const canCreate = useMemo(() => me && (me.role === "admin" || me.role === "manager"), [me])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [m, ps] = await Promise.all([
        apiGet<Me>("/api/auth/me"),
        apiGet<Project[]>("/api/projects"),
      ])
      setMe(m)
      setItems(ps)
    } catch {
      setError("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onCreate() {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      await apiPost("/api/projects", { name: name.trim(), description: description.trim() || null })
      setOpen(false)
      setName("")
      setDescription("")
      load()
    } catch (e) {
      setError("Не удалось создать проект")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Проекты</h1>
        {canCreate && <Button color="primary" onPress={() => setOpen(true)}>Создать проект</Button>}
      </div>
      {error && <Alert color="danger" title={error} />}
      {loading ? (
        <div className="flex items-center justify-center p-10"><Spinner /></div>
      ) : (
        <Card className="p-0 overflow-auto">
          <Table removeWrapper aria-label="projects">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Название</TableColumn>
              <TableColumn>Описание</TableColumn>
              <TableColumn>Создан</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет проектов" items={items}>
              {(p: Project) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="truncate max-w-[400px]">{p.description || ""}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal isOpen={open} onOpenChange={setOpen} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Создать проект</ModalHeader>
              <ModalBody>
                <Input label="Название" value={name} onValueChange={setName} isRequired/>
                <Input label="Описание" value={description} onValueChange={setDescription} />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => setOpen(false)}>Отмена</Button>
                <Button color="primary" isDisabled={!name.trim()} isLoading={saving} onPress={onCreate}>Создать</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
