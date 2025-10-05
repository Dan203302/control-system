export async function apiGet<T>(url: string) {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

export async function apiPost<T>(url: string, data: any) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

export async function apiPatch<T>(url: string, data: any) {
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

export async function apiDelete<T>(url: string) {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}
