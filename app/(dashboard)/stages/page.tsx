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

type StageRow = { id: number; name: string; objectId: number; createdAt: string }
type ObjectRow = { id: number; name: string }
type Me = { id: string; name: string; email: string; role: string }

export default function Page() {
  const [me, setMe] = useState<Me | null>(null)
  const [items, setItems] = useState<StageRow[]>([])
  const [objects, setObjects] = useState<ObjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [objectId, setObjectId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const canCreate = useMemo(() => me && (me.role === "admin" || me.role === "manager"), [me])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [m, ss, os] = await Promise.all([
        apiGet<Me>("/api/auth/me"),
        apiGet<StageRow[]>("/api/stages"),
        apiGet<ObjectRow[]>("/api/objects"),
      ])
      setMe(m)
      setItems(ss)
      setObjects(os)
    } catch {
      setError("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onCreate() {
    if (!name.trim() || !objectId) return
    setSaving(true)
    setError("")
    try {
      await apiPost("/api/stages", { name: name.trim(), objectId: Number(objectId) })
      setOpen(false)
      setName("")
      setObjectId("")
      load()
    } catch (e) {
      setError("Не удалось создать этап")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Этапы</h1>
        {canCreate && <Button color="primary" onPress={() => setOpen(true)}>Создать этап</Button>}
      </div>
      {error && <Alert color="danger" title={error} />}
      {loading ? (
        <div className="flex items-center justify-center p-10"><Spinner /></div>
      ) : (
        <Card className="p-0 overflow-auto">
          <Table removeWrapper aria-label="stages">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Название</TableColumn>
              <TableColumn>Объект ID</TableColumn>
              <TableColumn>Создан</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Нет этапов" items={items}>
              {(s: StageRow) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.objectId}</TableCell>
                  <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
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
              <ModalHeader>Создать этап</ModalHeader>
              <ModalBody>
                <Input label="Название" value={name} onValueChange={setName} isRequired/>
                <Select label="Объект" selectedKeys={objectId ? [objectId] : []} onSelectionChange={(k) => setObjectId(String(Array.from(k)[0] || ""))}>
                  {objects.map(o => (
                    <SelectItem key={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => setOpen(false)}>Отмена</Button>
                <Button color="primary" isDisabled={!name.trim() || !objectId} isLoading={saving} onPress={onCreate}>Создать</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
