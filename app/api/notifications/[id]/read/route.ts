import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { markNotificationRead } from "@/services/notificationService"

type NotificationReadRouteDeps = {
  requireUserContext: typeof requireUserContext
  markNotificationRead: typeof markNotificationRead
}

export function createNotificationReadPatchHandler(deps: NotificationReadRouteDeps) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    const result = await deps.markNotificationRead(auth.supabase, auth.user.id, params.id)
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

export const PATCH = createNotificationReadPatchHandler({
  requireUserContext,
  markNotificationRead,
})
