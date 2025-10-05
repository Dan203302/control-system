import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }
  const token = req.cookies.get(process.env.COOKIE_NAME || "token")?.value
  if (!token) {
    if (pathname.startsWith("/api")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
    }
    const url = new URL("/login", req.url)
    return NextResponse.redirect(url)
  }
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "")
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    if (pathname.startsWith("/api")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
    }
    const url = new URL("/login", req.url)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/me",
    "/api/:path*",
    "/defects",
    "/defects/:path*",
    "/projects",
    "/projects/:path*",
    "/objects",
    "/objects/:path*",
    "/stages",
    "/stages/:path*",
    "/reports",
    "/reports/:path*"
  ],
}
