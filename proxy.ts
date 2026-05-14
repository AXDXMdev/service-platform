import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")

  if (
    !isAdminPath ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/session")
  ) {
    return NextResponse.next()
  }

  if (!isAdminConfigured()) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("error", "not-configured")
    return NextResponse.redirect(loginUrl)
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value
  if (hasValidAdminCookie(cookieValue)) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/admin/login", request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/admin/:path*"],
}
