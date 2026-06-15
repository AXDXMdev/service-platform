import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import {
  BETA_ACCESS_COOKIE,
  hasValidBetaAccess,
  isBetaExemptPath,
} from "@/lib/betaAccess"

function createNonce() {
  const value = crypto.randomUUID()
  if (typeof btoa === "function") return btoa(value)
  return value.replace(/-/g, "")
}

function buildCsp(nonce: string, mode: "strict" | "public" = "strict") {
  const isDev = process.env.NODE_ENV !== "production"
  const scriptSrc =
    mode === "strict"
      ? [
          "'self'",
          `'nonce-${nonce}'`,
          "'strict-dynamic'",
          "https://pagead2.googlesyndication.com",
          "https://va.vercel-scripts.com",
          isDev ? "'unsafe-eval'" : null,
        ]
          .filter(Boolean)
          .join(" ")
      : [
          "'self'",
          "'unsafe-inline'",
          "https://pagead2.googlesyndication.com",
          "https://va.vercel-scripts.com",
          isDev ? "'unsafe-eval'" : null,
        ]
          .filter(Boolean)
          .join(" ")
  const styleSrc =
    mode === "strict"
      ? `'self' 'nonce-${nonce}'`
      : "'self' 'unsafe-inline'"

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
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

function withCsp(
  request: NextRequest,
  response?: NextResponse,
  mode: "strict" | "public" = "strict"
) {
  const nonce = createNonce()
  const csp = buildCsp(nonce, mode)
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
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")
  const cspMode = isAdminPath ? "strict" : "public"

  if (host === "www.hilfinio.de") {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.hostname = "hilfinio.de"
    return withCsp(request, NextResponse.redirect(canonicalUrl, 308), cspMode)
  }

  if (
    !isBetaExemptPath(pathname) &&
    !hasValidBetaAccess(request.cookies.get(BETA_ACCESS_COOKIE)?.value)
  ) {
    const betaUrl = new URL("/beta", request.url)
    betaUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return withCsp(request, NextResponse.redirect(betaUrl), cspMode)
  }

  if (
    !isAdminPath ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/session") ||
    pathname.startsWith("/admin/role")
  ) {
    return withCsp(request, undefined, cspMode)
  }

  if (!isAdminConfigured()) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("error", "not-configured")
    return withCsp(request, NextResponse.redirect(loginUrl), cspMode)
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value
  if (hasValidAdminCookie(cookieValue)) {
    return withCsp(request, undefined, cspMode)
  }

  const loginUrl = new URL("/admin/login", request.url)
  return withCsp(request, NextResponse.redirect(loginUrl), cspMode)
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
