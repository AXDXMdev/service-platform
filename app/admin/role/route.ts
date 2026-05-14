import { apiError, apiOk } from "@/lib/apiResponse"
import { logServerError } from "@/lib/serverLogger"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"

type Role = "admin" | "moderator" | "provider" | "customer"

type AdminRoleRouteDeps = {
  hasSupabaseEnv: () => boolean
  createPublicClient: (authHeader?: string) => ReturnType<typeof createServerSupabasePublicClient>
  logServerError: typeof logServerError
}

const defaultDeps: AdminRoleRouteDeps = {
  hasSupabaseEnv: () => Boolean(getSupabasePublicEnv()),
  createPublicClient: createServerSupabasePublicClient,
  logServerError,
}

export function createAdminRoleGetHandler(overrides: Partial<AdminRoleRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET(request: Request) {
    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Supabase env vars fehlen.")
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError(401, "unauthorized", "Authorization fehlt.")
    }

    const supabase = deps.createPublicClient(authHeader)
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden.")
    }

    const userResult = await supabase.auth.getUser()
    const user = userResult.data.user
    if (!user) {
      return apiError(401, "unauthorized", "Nicht eingeloggt.")
    }

    const profile = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile.error) {
      deps.logServerError("Admin role lookup failed", {
        userId: user.id,
        error: profile.error.message,
      })
      return apiError(500, "upstream_error", "Rollencheck fehlgeschlagen.")
    }

    const role = (profile.data?.role ?? null) as Role | null
    return apiOk({ role })
  }
}

export const GET = createAdminRoleGetHandler()
