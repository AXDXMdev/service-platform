import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { listNotifications } from "@/services/notificationService"

type NotificationsRouteDeps = {
  requireUserContext: typeof requireUserContext
  listNotifications: typeof listNotifications
}

export function createNotificationsGetHandler(deps: NotificationsRouteDeps) {
  return async function GET(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.listNotifications(auth.supabase, auth.user.id)
    if (!result.ok) return apiError(result.status, "upstream_error", result.message)

    return apiOk(result.data)
  }
}

export const GET = createNotificationsGetHandler({
  requireUserContext,
  listNotifications,
})
