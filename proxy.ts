import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"

function createNonce() {
  const value = crypto.randomUUID()
  if (typeof btoa === "function") return btoa(value)
  return value.replace(/-/g, "")
}

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production"
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://pagead2.googlesyndication.com",
    "https://va.vercel-scripts.com",
    isDev ? "'unsafe-eval'" : null,
  ]
    .filter(Boolean)
    .join(" ")

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https: wss: https://va.vercel-scripts.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")
}

function withCsp(request: NextRequest, response?: NextResponse) {
  const nonce = createNonce()
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const nextResponse =
    response ??
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  nextResponse.headers.set("Content-Security-Policy", csp)
  nextResponse.headers.set("x-nonce", nonce)
  return nextResponse
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get("host")?.toLowerCase()

  if (host === "www.hilfinio.de") {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.hostname = "hilfinio.de"
    return withCsp(request, NextResponse.redirect(canonicalUrl, 308))
  }

  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")

  if (
    !isAdminPath ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/session")
  ) {
    return withCsp(request)
  }

  if (!isAdminConfigured()) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("error", "not-configured")
    return withCsp(request, NextResponse.redirect(loginUrl))
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value
  if (hasValidAdminCookie(cookieValue)) {
    return withCsp(request)
  }

  const loginUrl = new URL("/admin/login", request.url)
  return withCsp(request, NextResponse.redirect(loginUrl))
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
