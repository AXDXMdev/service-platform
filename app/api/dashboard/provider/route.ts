import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadProviderDashboardData } from "@/services/dashboardReadService"

type ProviderDashboardRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadProviderDashboardData: typeof loadProviderDashboardData
}

export function createProviderDashboardGetHandler(deps: ProviderDashboardRouteDeps) {
  return async function GET(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.loadProviderDashboardData(auth.supabase, auth.user)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createProviderDashboardGetHandler({
  requireUserContext,
  loadProviderDashboardData,
})
