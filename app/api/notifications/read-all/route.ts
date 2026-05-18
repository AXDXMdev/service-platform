import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { markAllNotificationsRead } from "@/services/notificationService"

type NotificationsReadAllRouteDeps = {
  requireUserContext: typeof requireUserContext
  markAllNotificationsRead: typeof markAllNotificationsRead
}

export function createNotificationsReadAllPatchHandler(deps: NotificationsReadAllRouteDeps) {
  return async function PATCH(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.markAllNotificationsRead(auth.supabase, auth.user.id)
    if (!result.ok) return apiError(result.status, "upstream_error", result.message)

    return apiOk(result.data)
  }
}

export const PATCH = createNotificationsReadAllPatchHandler({
  requireUserContext,
  markAllNotificationsRead,
})
