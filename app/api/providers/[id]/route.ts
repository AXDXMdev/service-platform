import { apiError, apiOk } from "@/lib/apiResponse"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadProviderProfileData } from "@/services/publicCatalogService"

type ProviderProfileRouteDeps = {
  hasSupabaseEnv: () => boolean
  createPublicClient: () => ReturnType<typeof createServerSupabasePublicClient>
  loadProviderProfileData: typeof loadProviderProfileData
}

const defaultDeps: ProviderProfileRouteDeps = {
  hasSupabaseEnv: () => Boolean(getSupabasePublicEnv()),
  createPublicClient: () => createServerSupabasePublicClient(),
  loadProviderProfileData,
}

export function createProviderProfileGetHandler(overrides: Partial<ProviderProfileRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Supabase env vars fehlen.")
    }

    const supabase = deps.createPublicClient()
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden.")
    }

    const params = await context.params
    const result = await deps.loadProviderProfileData(supabase, params.id)
    if (!result.ok) {
      return apiError(result.status, result.status === 400 ? "bad_request" : "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createProviderProfileGetHandler()
