import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { apiError } from "@/lib/apiResponse"
import {
  ADMIN_ACTOR_COOKIE,
  ADMIN_COOKIE,
  getAdminPassword,
  getAdminToken,
  isAdminConfigured,
} from "@/lib/adminSession"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import {
  createServerSupabaseAdminClient,
  createServerSupabasePublicClient,
  getSupabasePublicEnv,
  getSupabaseServiceRoleEnv,
} from "@/lib/serverSupabase"

function redirectWithError(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`)
}

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["admin-login-submit", ip]), 8, 15 * 60 * 1000)) {
    redirectWithError("Zu viele Login-Versuche. Bitte später erneut.")
  }

  if (!isAdminConfigured() || !getSupabasePublicEnv() || !getSupabaseServiceRoleEnv()) {
    redirectWithError("Admin-Login ist serverseitig nicht vollständig konfiguriert.")
  }

  const form = await request.formData().catch(() => null)
  if (!form) redirectWithError("Login-Formular konnte nicht gelesen werden.")

  const email = String(form.get("email") ?? "").trim().toLowerCase()
  const password = String(form.get("password") ?? "")
  const adminKey = String(form.get("adminKey") ?? "").trim()

  if (!email || !password || !adminKey) {
    redirectWithError("Bitte E-Mail, Passwort und Admin-Schlüssel ausfüllen.")
  }

  if (adminKey !== getAdminPassword()) {
    redirectWithError("Falscher Admin-Schlüssel.")
  }

  const publicClient = createServerSupabasePublicClient()
  const adminClient = createServerSupabaseAdminClient()
  if (!publicClient || !adminClient) {
    redirectWithError("Supabase konnte nicht initialisiert werden.")
  }

  const login = await publicClient.auth.signInWithPassword({ email, password })
  if (login.error || !login.data.user) {
    redirectWithError("Falsche E-Mail oder falsches Passwort.")
  }

  const profile = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", login.data.user.id)
    .maybeSingle()

  const role = (profile.data as { role?: string | null } | null)?.role ?? null
  if (profile.error || !role || !["admin", "moderator"].includes(role)) {
    redirectWithError("Dieses Konto ist nicht als Admin oder Moderator freigeschaltet.")
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 })

  response.cookies.set({
    name: ADMIN_COOKIE,
    value: getAdminToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  response.cookies.set({
    name: ADMIN_ACTOR_COOKIE,
    value: login.data.user.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })

  return response
}

export function GET() {
  return apiError(405, "method_not_allowed", "Bitte das Login-Formular verwenden.")
}
