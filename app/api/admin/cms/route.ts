import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { readJsonBody, requireSameOrigin } from "@/lib/requestSecurity"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { executeAdminCmsAction, type AdminCmsAction } from "@/services/adminCmsService"

type AdminCmsRouteDeps = {
  getAdminCookieValue: () => Promise<string | undefined>
  hasAdminSession: (cookieValue: string | undefined) => boolean
  isConfigured: () => boolean
  hasSupabaseEnv: () => boolean
  createAdminClient: typeof createServerSupabaseAdminClient
  executeAction: typeof executeAdminCmsAction
}

function isAdminCmsAction(value: unknown): value is AdminCmsAction {
  if (!value || typeof value !== "object") return false
  const action = (value as { action?: unknown }).action
  return typeof action === "string"
}

export function createAdminCmsPostHandler(deps: AdminCmsRouteDeps) {
  return async function POST(request: Request) {
    const originError = requireSameOrigin(request)
    if (originError) return originError

    const cookieValue = await deps.getAdminCookieValue()
    if (!deps.hasAdminSession(cookieValue)) {
      return apiError(401, "unauthorized", "Admin-Session erforderlich.")
    }

    if (!deps.isConfigured() || !deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Admin-CMS ist serverseitig noch nicht vollständig konfiguriert.")
    }

    const supabase = deps.createAdminClient()
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
    }

    const json = await readJsonBody(request)
    if (!json.ok) return json.response
    const body = json.body
    if (!isAdminCmsAction(body)) {
      return apiError(400, "bad_request", "Ungültige CMS-Aktion.")
    }

    const result = await deps.executeAction(supabase, body)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError("Admin CMS action failed", { action: body.action, message: result.message })
      }
      return apiError(
        result.status,
        result.status === 400 ? "bad_request" : result.status === 401 ? "unauthorized" : "upstream_error",
        result.message
      )
    }

    return apiOk({ message: result.message })
  }
}

export const POST = createAdminCmsPostHandler({
  getAdminCookieValue: async () => {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value
  },
  hasAdminSession: (cookieValue) => isAdminConfigured() && hasValidAdminCookie(cookieValue),
  isConfigured: () => isAdminConfigured(),
  hasSupabaseEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  executeAction: executeAdminCmsAction,
})
