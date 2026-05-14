import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { executeAdminModerationAction, type AdminModerationAction } from "@/services/adminModerationService"

type AdminModerationRouteDeps = {
  getAdminCookieValue: () => Promise<string | undefined>
  hasAdminSession: (cookieValue: string | undefined) => boolean
  isConfigured: () => boolean
  hasSupabaseEnv: () => boolean
  createAdminClient: typeof createServerSupabaseAdminClient
  executeAction: typeof executeAdminModerationAction
}

function isAdminModerationAction(value: unknown): value is AdminModerationAction {
  if (!value || typeof value !== "object") return false
  const action = (value as { action?: unknown }).action
  return typeof action === "string"
}

export function createAdminModerationPostHandler(deps: AdminModerationRouteDeps) {
  return async function POST(request: Request) {
    const cookieValue = await deps.getAdminCookieValue()
    if (!deps.hasAdminSession(cookieValue)) {
      return apiError(401, "unauthorized", "Admin-Session erforderlich.")
    }

    if (!deps.isConfigured() || !deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Admin-Moderation ist serverseitig noch nicht vollständig konfiguriert.")
    }

    const supabase = deps.createAdminClient()
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
    }

    const body = await request.json().catch(() => null)
    if (!isAdminModerationAction(body)) {
      return apiError(400, "bad_request", "Ungültige Moderations-Aktion.")
    }

    const result = await deps.executeAction(supabase, body)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError("Admin moderation action failed", { action: body.action, message: result.message })
      }
      return apiError(
        result.status,
        result.status === 400 ? "bad_request" : result.status === 401 ? "unauthorized" : result.status === 403 ? "forbidden" : "upstream_error",
        result.message
      )
    }

    return apiOk({ message: result.message })
  }
}

export const POST = createAdminModerationPostHandler({
  getAdminCookieValue: async () => {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value
  },
  hasAdminSession: (cookieValue) => isAdminConfigured() && hasValidAdminCookie(cookieValue),
  isConfigured: () => isAdminConfigured(),
  hasSupabaseEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  executeAction: executeAdminModerationAction,
})
