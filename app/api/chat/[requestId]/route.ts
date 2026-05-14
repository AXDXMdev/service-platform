import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { loadChatMessages } from "@/services/chatReadService"

type ChatReadRouteDeps = {
  requireUserContext: typeof requireUserContext
  loadChatMessages: typeof loadChatMessages
}

export function createChatGetHandler(deps: ChatReadRouteDeps) {
  return async function GET(
    request: Request,
    context: { params: Promise<{ requestId: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    const result = await deps.loadChatMessages(auth.supabase, auth.user, params.requestId)
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

export const GET = createChatGetHandler({
  requireUserContext,
  loadChatMessages,
})
