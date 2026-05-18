import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadInboxData } from "@/services/inboxService"

type InboxRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadInboxData: typeof loadInboxData
}

export function createInboxGetHandler(deps: InboxRouteDeps) {
  return async function GET(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const result = await deps.loadInboxData(auth.supabase, auth.user)
    if (!result.ok) return apiError(result.status, "upstream_error", result.message)

    return apiOk(result.data)
  }
}

export const GET = createInboxGetHandler({
  requireUserContext,
  loadInboxData,
})
