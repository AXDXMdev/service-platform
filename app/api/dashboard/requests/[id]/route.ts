import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadRequestDetail } from "@/services/inboxService"

type RequestDetailRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadRequestDetail: typeof loadRequestDetail
}

export function createRequestDetailGetHandler(deps: RequestDetailRouteDeps) {
  return async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    const result = await deps.loadRequestDetail(auth.supabase, auth.user, params.id)
    if (!result.ok) {
      return apiError(
        result.status,
        result.status === 400 ? "bad_request" : result.status === 404 ? "not_found" : "upstream_error",
        result.message
      )
    }

    return apiOk(result.data)
  }
}

export const GET = createRequestDetailGetHandler({
  requireUserContext,
  loadRequestDetail,
})
