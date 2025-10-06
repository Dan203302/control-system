"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@heroui/card"
import { Button } from "@heroui/button"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal"
import { Input } from "@heroui/input"
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table"
import { Select, SelectItem } from "@heroui/select"
import { Alert } from "@heroui/alert"
import { Spinner } from "@heroui/spinner"
import { apiGet, apiPost } from "@/lib/api"

type ObjectRow = { id: number; name: string; address: string | null; projectId: number; createdAt: string }
type Project = { id: number; name: string }
type Me = { id: string; name: string; email: string; role: string }

export default function Page() {
  const [me, setMe] = useState<Me | null>(null)
  const [items, setItems] = useState<ObjectRow[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [projectId, setProjectId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const canCreate = useMemo(() => me && (me.role === "admin" || me.role === "manager"), [me])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [m, os, ps] = await Promise.all([
        apiGet<Me>("/api/auth/me"),
        apiGet<ObjectRow[]>("/api/objects"),
        apiGet<Project[]>("/api/projects"),
      ])
      setMe(m)
      setItems(os)
      setProjects(ps)
    } catch {
      setError("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onCreate() {
    if (!name.trim() || !projectId) return
    setSaving(true)
    setError("")
    try {
      await apiPost("/api/objects", { name: name.trim(), address: address.trim() || null, projectId: Number(projectId) })
      setOpen(false)
      setName("")
      setAddress("")
      setProjectId("")
      load()
    } catch (e) {
      setError("Не удалось создать объект")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Объекты</h1>
        {canCreate && <Button color="primary" onPress={() => setOpen(true)}>Создать объект</Button>}
      </div>
      {error && <Alert color="danger" title={error} />}
      {loading ? (
        <div className="flex items-center justify-center p-10"><Spinner /></div>
      ) : (
        <Card className="p-0 overflow-auto">
          <Table removeWrapper aria-label="objects">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Название</TableColumn>
              <TableColumn>Адрес</TableColumn>
              <TableColumn>Проект ID</TableColumn>
              <TableColumn>Создан</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет объектов" items={items}>
              {(o: ObjectRow) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.name}</TableCell>
                  <TableCell className="truncate max-w-[400px]">{o.address || ""}</TableCell>
                  <TableCell>{o.projectId}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
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
              <ModalHeader>Создать объект</ModalHeader>
              <ModalBody>
                <Input label="Название" value={name} onValueChange={setName} isRequired/>
                <Input label="Адрес" value={address} onValueChange={setAddress} />
                <Select label="Проект" selectedKeys={projectId ? [projectId] : []} onSelectionChange={(k) => setProjectId(String(Array.from(k)[0] || ""))}>
                  {projects.map(p => (
                    <SelectItem key={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => setOpen(false)}>Отмена</Button>
                <Button color="primary" isDisabled={!name.trim() || !projectId} isLoading={saving} onPress={onCreate}>Создать</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
