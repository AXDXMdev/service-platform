import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { updateRequestStatus } from "@/services/requestService"
import { validateRequestStatusInput } from "@/services/validation"

type RequestStatusRouteDeps = {
  requireUserContext: typeof requireUserContext
  updateRequestStatus: typeof updateRequestStatus
  validateRequestStatusInput: typeof validateRequestStatusInput
}

export function createRequestStatusPatchHandler(deps: RequestStatusRouteDeps) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    const body = await request.json().catch(() => null)
    const parsed = deps.validateRequestStatusInput(body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.updateRequestStatus(auth.supabase, auth.user, {
      requestId: params.id,
      nextStatus: parsed.value.nextStatus,
      note: parsed.value.note,
    })

    if (!result.ok) {
      const code =
        result.status === 403
          ? "forbidden"
          : result.status === 404
            ? "not_found"
            : result.status >= 500
              ? "upstream_error"
              : "bad_request"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export const PATCH = createRequestStatusPatchHandler({
  requireUserContext,
  updateRequestStatus,
  validateRequestStatusInput,
})
