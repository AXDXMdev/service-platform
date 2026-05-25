import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import {
  ADMIN_COOKIE,
  getAdminPassword,
  getAdminToken,
  hasValidAdminCookie,
  isAdminConfigured,
} from "@/lib/adminSession"
import { readJsonBody, requireSameOrigin } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"

export async function GET() {
  if (!isAdminConfigured()) {
    return apiError(
      503,
      "configuration_error",
      "Admin-Login ist noch nicht vollständig konfiguriert (ADMIN_PANEL_PASSWORD oder ADMIN_PANEL_SECRET sowie ADMIN_PANEL_TOKEN erforderlich)."
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
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["admin-login", ip]), 8, 15 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Login-Versuche. Bitte später erneut.")
  }

  if (!isAdminConfigured()) {
    return apiError(503, "configuration_error", "ADMIN_PANEL_PASSWORD/ADMIN_PANEL_SECRET oder ADMIN_PANEL_TOKEN fehlt.")
  }

  const password = getAdminPassword()
  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const payload = json.body as { password?: string }

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
