import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { createChatMessage } from "@/services/chatService"
import { validateChatMessageInput } from "@/services/validation"

type ChatRouteDeps = {
  requireUserContext: typeof requireUserContext
  createChatMessage: typeof createChatMessage
  validateChatMessageInput: typeof validateChatMessageInput
}

export function createChatPostHandler(deps: ChatRouteDeps) {
  return async function POST(request: Request) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = deps.validateChatMessageInput(body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.createChatMessage(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      const code =
        result.status === 403 ? "forbidden" : result.status === 404 ? "not_found" : "upstream_error"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export const POST = createChatPostHandler({
  requireUserContext,
  createChatMessage,
  validateChatMessageInput,
})
