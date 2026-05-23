import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { createRequestLogContext, logServerInfo } from "@/lib/serverLogger"
import { readJsonBody } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
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
    if (
      await isRateLimitedAsync(
        buildRateLimitKey(["request-create", getRequestIp(request), auth.user.id]),
        20,
        10 * 60 * 1000
      )
    ) {
      return apiError(429, "rate_limited", "Zu viele Anfragen in kurzer Zeit. Bitte später erneut.")
    }

    const json = await readJsonBody(request)
    if (!json.ok) return json.response
    const parsed = deps.validateRequestCreateInput(json.body)
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
