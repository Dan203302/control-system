import path from 'node:path'
import fs from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'

export function getUploadDir() {
  const base = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
  return base
}

export async function saveFile(file: File, defectId: number) {
  const array = new Uint8Array(await file.arrayBuffer())
  const hash = createHash('sha256').update(array).digest('hex')
  const id = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const relative = path.join(String(defectId), id + '_' + safeName)
  const fullDir = path.join(getUploadDir(), String(defectId))
  if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true })
  const fullPath = path.join(getUploadDir(), relative)
  fs.writeFileSync(fullPath, array)
  return { storageKey: relative, checksum: hash, size: array.byteLength, mime: file.type || 'application/octet-stream', filename: safeName, path: fullPath }
}

export function getPath(storageKey: string) {
  return path.join(getUploadDir(), storageKey)
}
