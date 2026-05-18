import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { markRequestMessagesRead } from "@/services/inboxService"

type RequestReadRouteDeps = {
  requireUserContext: typeof requireUserContext
  markRequestMessagesRead: typeof markRequestMessagesRead
}

export function createRequestReadPatchHandler(deps: RequestReadRouteDeps) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    const result = await deps.markRequestMessagesRead(auth.supabase, auth.user, params.id)
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

export const PATCH = createRequestReadPatchHandler({
  requireUserContext,
  markRequestMessagesRead,
})
