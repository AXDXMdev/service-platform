import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadCustomerRequestsData } from "@/services/dashboardReadService"

type CustomerDashboardRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadCustomerRequestsData: typeof loadCustomerRequestsData
}

export function createCustomerDashboardGetHandler(deps: CustomerDashboardRouteDeps) {
  return async function GET(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.loadCustomerRequestsData(auth.supabase, auth.user)
    if (!result.ok) {
      return apiError(result.status, "upstream_error", result.message)
    }

    return apiOk(result.data)
  }
}

export const GET = createCustomerDashboardGetHandler({
  requireUserContext,
  loadCustomerRequestsData,
})
