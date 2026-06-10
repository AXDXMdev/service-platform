import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_ACTOR_COOKIE, ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { requireAuthenticatedUser } from "@/lib/serverAuth"
import { createRequestLogContext, logServerError, logServerInfo } from "@/lib/serverLogger"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { loadAdminOverview } from "@/services/adminOverviewService"

type AdminOverviewRouteDeps = {
  requireUserContext: typeof requireAuthenticatedUser
  getAdminCookieValue: () => Promise<string | undefined>
  getAdminActorCookieValue: () => Promise<string | undefined>
  hasAdminSession: (value: string | undefined) => boolean
  hasSupabaseEnv: () => boolean
  createAdminClient: typeof createServerSupabaseAdminClient
  loadOverview: typeof loadAdminOverview
}

const defaultDependencies: AdminOverviewRouteDeps = {
  requireUserContext: requireAuthenticatedUser,
  getAdminCookieValue: async () => {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value
  },
  getAdminActorCookieValue: async () => {
    try {
      const store = await cookies()
      return store.get(ADMIN_ACTOR_COOKIE)?.value
    } catch {
      return undefined
    }
  },
  hasAdminSession: (value) => isAdminConfigured() && hasValidAdminCookie(value),
  hasSupabaseEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  loadOverview: loadAdminOverview,
}

export function createAdminOverviewGetHandler(overrides: Partial<AdminOverviewRouteDeps> = {}) {
  const deps = { ...defaultDependencies, ...overrides }

  return async function GET(request: Request) {
    const startedAt = Date.now()
    const logContext = createRequestLogContext(request, { route: "/api/admin/overview" })

    const cookieValue = await deps.getAdminCookieValue()
    if (!deps.hasAdminSession(cookieValue)) {
      return apiError(401, "unauthorized", "Admin-Session erforderlich.")
    }

    const auth = await deps.requireUserContext(request)
    const fallbackActorUserId = auth.error || !auth.user ? await deps.getAdminActorCookieValue() : undefined
    const actorUserId = auth.user?.id ?? fallbackActorUserId
    if (!actorUserId) return auth.error ?? apiError(401, "unauthorized", "Nicht eingeloggt.")

    if (!deps.hasSupabaseEnv()) {
      return apiError(
        503,
        "configuration_error",
        "Admin-Overview benötigt SUPABASE_SERVICE_ROLE_KEY auf dem Server."
      )
    }

    const admin = deps.createAdminClient()
    if (!admin) {
      return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
    }

    const result = await deps.loadOverview(admin as never, actorUserId)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError("Admin overview load failed", {
          ...logContext,
          userId: actorUserId,
          durationMs: Date.now() - startedAt,
          message: result.message,
        })
      }
      return apiError(
        result.status,
        result.status === 403 ? "forbidden" : "upstream_error",
        result.message
      )
    }

    logServerInfo("Admin overview loaded", {
      ...logContext,
      userId: actorUserId,
      role: result.data.role,
      durationMs: Date.now() - startedAt,
    })

    return apiOk(result.data)
  }
}

export const GET = createAdminOverviewGetHandler()
