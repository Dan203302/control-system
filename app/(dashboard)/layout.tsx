"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar"
import { Button } from "@heroui/button"

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar maxWidth="full" className="border-b border-default-200">
        <NavbarBrand>
          <Link href="/defects" className="font-semibold">СистемаКонтроля</Link>
        </NavbarBrand>
        <NavbarContent justify="center" className="gap-6">
          <NavbarItem isActive={pathname === "/defects"}><Link href="/defects">Дефекты</Link></NavbarItem>
          <NavbarItem isActive={pathname === "/projects"}><Link href="/projects">Проекты</Link></NavbarItem>
          <NavbarItem isActive={pathname === "/objects"}><Link href="/objects">Объекты</Link></NavbarItem>
          <NavbarItem isActive={pathname === "/stages"}><Link href="/stages">Этапы</Link></NavbarItem>
          <NavbarItem isActive={pathname === "/reports"}><Link href="/reports">Отчёты</Link></NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button size="sm" variant="flat" onPress={() => router.push("/me")}>Профиль</Button>
          </NavbarItem>
          <NavbarItem>
            <Button size="sm" color="danger" onPress={signOut}>Выход</Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
