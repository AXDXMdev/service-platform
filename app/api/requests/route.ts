import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { createRequestLogContext, logServerInfo } from "@/lib/serverLogger"
import { createRequest } from "@/services/requestService"
import { validateRequestCreateInput } from "@/services/validation"

type RequestRouteDeps = {
  requireUserContext: typeof requireUserContext
  createRequest: typeof createRequest
  validateRequestCreateInput: typeof validateRequestCreateInput
}

export function createRequestsPostHandler(deps: RequestRouteDeps) {
  return async function POST(request: Request) {
    const startedAt = Date.now()
    const logContext = createRequestLogContext(request, { route: "/api/requests" })

    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = deps.validateRequestCreateInput(body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.createRequest(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      return apiError(
        result.status,
        result.status === 403 ? "forbidden" : result.status === 404 ? "not_found" : "upstream_error",
        result.message
      )
    }

    logServerInfo("Request created", {
      ...logContext,
      userId: auth.user.id,
      serviceId: parsed.value.serviceId,
      durationMs: Date.now() - startedAt,
    })

    return apiOk(result.data)
  }
}

export const POST = createRequestsPostHandler({
  requireUserContext,
  createRequest,
  validateRequestCreateInput,
})
