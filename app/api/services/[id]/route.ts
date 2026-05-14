import { apiError, apiOk } from "@/lib/apiResponse"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadServiceDetailData } from "@/services/serviceDetailReadService"

type ServiceDetailRouteDeps = {
  hasSupabaseEnv: () => boolean
  createPublicClient: (authHeader?: string) => ReturnType<typeof createServerSupabasePublicClient>
  loadServiceDetailData: typeof loadServiceDetailData
}

const defaultDeps: ServiceDetailRouteDeps = {
  hasSupabaseEnv: () => Boolean(getSupabasePublicEnv()),
  createPublicClient: createServerSupabasePublicClient,
  loadServiceDetailData,
}

export function createServiceDetailGetHandler(overrides: Partial<ServiceDetailRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Supabase env vars fehlen.")
    }

    const authHeader = request.headers.get("authorization")
    const supabase = deps.createPublicClient(
      authHeader?.startsWith("Bearer ") ? authHeader : undefined
    )
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden.")
    }

    const userResult = await supabase.auth.getUser()
    const user = userResult.data.user ?? null
    const params = await context.params
    const result = await deps.loadServiceDetailData(supabase, params.id, user)
    if (!result.ok) {
      const code =
        result.status === 400 ? "bad_request" : result.status === 404 ? "not_found" : "upstream_error"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createServiceDetailGetHandler()
