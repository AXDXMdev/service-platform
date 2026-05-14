import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import {
  ADMIN_COOKIE,
  getAdminPassword,
  getAdminToken,
  hasValidAdminCookie,
  isAdminConfigured,
} from "@/lib/adminSession"
import { getRequestIp, isRateLimited } from "@/lib/serverRateLimit"

export async function GET() {
  if (!isAdminConfigured()) {
    return apiError(
      503,
      "configuration_error",
      "Admin-Login ist noch nicht vollständig konfiguriert (ADMIN_PANEL_PASSWORD und ADMIN_PANEL_TOKEN erforderlich)."
    )
  }

  const store = await cookies()
  const cookieValue = store.get(ADMIN_COOKIE)?.value
  const ok = hasValidAdminCookie(cookieValue)

  if (!ok) {
    return apiError(401, "unauthorized", "Keine gültige Admin-Session.")
  }

  return apiOk({ authenticated: true })
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get("origin")
  if (origin && origin !== requestUrl.origin) {
    return apiError(403, "forbidden", "Ungültige Herkunft (Origin).")
  }

  const ip = getRequestIp(request)
  if (isRateLimited(`admin-login:${ip}`)) {
    return apiError(429, "rate_limited", "Zu viele Login-Versuche. Bitte später erneut.")
  }

  if (!isAdminConfigured()) {
    return apiError(503, "configuration_error", "ADMIN_PANEL_PASSWORD oder ADMIN_PANEL_TOKEN fehlt.")
  }

  const password = getAdminPassword()
  let payload: { password?: string } = {}
  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      return apiError(415, "unsupported_media_type", "Content-Type muss application/json sein.")
    }
    payload = (await request.json()) as { password?: string }
  } catch {
    return apiError(400, "bad_request", "Ungültiger Request-Body.")
  }

  if (
    typeof payload.password !== "string" ||
    payload.password.length > 300 ||
    payload.password !== password
  ) {
    return apiError(401, "unauthorized", "Falscher Admin-Schlüssel.")
  }

  const response = apiOk({ authenticated: true })
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: getAdminToken(),
    httpOnly: true,
    // Lax is reliable locally while still preventing most CSRF vectors for navigations.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })

  return response
}

export async function DELETE() {
  const response = apiOk({ authenticated: false })
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
