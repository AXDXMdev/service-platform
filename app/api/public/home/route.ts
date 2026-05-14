import { apiError, apiOk } from "@/lib/apiResponse"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadHomeFeaturedData } from "@/services/publicCatalogService"

type PublicHomeRouteDeps = {
  hasSupabaseEnv: () => boolean
  createPublicClient: () => ReturnType<typeof createServerSupabasePublicClient>
  loadHomeFeaturedData: typeof loadHomeFeaturedData
}

const defaultDeps: PublicHomeRouteDeps = {
  hasSupabaseEnv: () => Boolean(getSupabasePublicEnv()),
  createPublicClient: () => createServerSupabasePublicClient(),
  loadHomeFeaturedData,
}

export function createPublicHomeGetHandler(overrides: Partial<PublicHomeRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET() {
    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Supabase env vars fehlen.")
    }

    const supabase = deps.createPublicClient()
    if (!supabase) {
      return apiError(503, "configuration_error", "Supabase Client konnte nicht initialisiert werden.")
    }

    const result = await deps.loadHomeFeaturedData(supabase)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createPublicHomeGetHandler()
