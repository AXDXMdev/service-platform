import { apiError, apiOk } from "@/lib/apiResponse"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadServicesCatalogData } from "@/services/publicCatalogService"

type PublicServicesRouteDeps = {
  hasSupabaseEnv: () => boolean
  createPublicClient: () => ReturnType<typeof createServerSupabasePublicClient>
  loadServicesCatalogData: typeof loadServicesCatalogData
}

const defaultDeps: PublicServicesRouteDeps = {
  hasSupabaseEnv: () => Boolean(getSupabasePublicEnv()),
  createPublicClient: () => createServerSupabasePublicClient(),
  loadServicesCatalogData,
}

export function createPublicServicesGetHandler(overrides: Partial<PublicServicesRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET() {
    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Supabase env vars fehlen.")
    }

    const supabase = deps.createPublicClient()
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden.")
    }

    const result = await deps.loadServicesCatalogData(supabase)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createPublicServicesGetHandler()
