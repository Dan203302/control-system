"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar"
import { Button } from "@heroui/button"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { apiGet } from "@/lib/api"
import { Skeleton } from "@heroui/skeleton"

export type Me = { id: string; name: string; email: string; role: string; roleDescription: string | null }

export default function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    apiGet<Me>("/api/auth/me").then(v => { if (!cancelled) setMe(v) }).catch(() => setMe(null))
    return () => { cancelled = true }
  }, [])

  const loading = me === undefined
  const showReports = useMemo(() => {
    if (!me) return false
    return ["admin", "manager", "observer"].includes(me.role)
  }, [me])
  const canManageRefs = useMemo(() => {
    if (!me) return false
    return ["admin", "manager"].includes(me.role)
  }, [me])

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }

  return (
    <Navbar maxWidth="full" className="border-b border-default-200">
      <NavbarBrand>
        <Link href="/defects" className="font-semibold">СистемаКонтроля</Link>
      </NavbarBrand>

      <NavbarContent justify="center" className="gap-6">
        <NavbarItem isActive={pathname === "/defects"}><Link href="/defects">Дефекты</Link></NavbarItem>
        {!loading && canManageRefs && <NavbarItem isActive={pathname === "/projects"}><Link href="/projects">Проекты</Link></NavbarItem>}
        {!loading && canManageRefs && <NavbarItem isActive={pathname === "/objects"}><Link href="/objects">Объекты</Link></NavbarItem>}
        {!loading && canManageRefs && <NavbarItem isActive={pathname === "/stages"}><Link href="/stages">Этапы</Link></NavbarItem>}
        {!loading && showReports && <NavbarItem isActive={pathname === "/reports"}><Link href="/reports">Отчёты</Link></NavbarItem>}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-large" />
            <Skeleton className="h-8 w-24 rounded-large" />
          </div>
        ) : me ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button variant="flat" size="sm">{me.name}</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="user-menu" disabledKeys={["role"]} onAction={(key) => {
              if (key === "profile") router.push("/me")
              if (key === "logout") signOut()
            }}>
              <DropdownItem key="role" className="opacity-80" isReadOnly>
                {me.roleDescription || me.role}
              </DropdownItem>
              <DropdownItem key="profile">Профиль</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">Выход</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem><Button as={Link} href="/login" size="sm" variant="flat">Войти</Button></NavbarItem>
            <NavbarItem><Button as={Link} href="/register" size="sm" color="primary">Регистрация</Button></NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  )
}
