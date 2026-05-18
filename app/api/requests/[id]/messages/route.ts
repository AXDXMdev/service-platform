import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import { requireUserContext } from "@/services/authService"
import { createChatMessage } from "@/services/chatService"
import { validateChatMessageInput } from "@/services/validation"

type RequestMessagesRouteDeps = {
  requireUserContext: typeof requireUserContext
  createChatMessage: typeof createChatMessage
  validateChatMessageInput: typeof validateChatMessageInput
}

export function createRequestMessagesPostHandler(deps: RequestMessagesRouteDeps) {
  return async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const params = await context.params
    if (
      await isRateLimitedAsync(
        buildRateLimitKey(["request-message", getRequestIp(request), auth.user.id, params.id]),
        40,
        10 * 60 * 1000
      )
    ) {
      return apiError(429, "rate_limited", "Zu viele Nachrichten in kurzer Zeit. Bitte spaeter erneut.")
    }

    const json = await readJsonBody(request)
    if (!json.ok) return json.response

    const parsed = deps.validateChatMessageInput({
      ...(typeof json.body === "object" && json.body ? json.body : {}),
      requestId: params.id,
    })
    if (!parsed.ok) return apiError(400, "bad_request", parsed.message)

    const result = await deps.createChatMessage(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      const code =
        result.status === 403 ? "forbidden" : result.status === 404 ? "not_found" : "upstream_error"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export const POST = createRequestMessagesPostHandler({
  requireUserContext,
  createChatMessage,
  validateChatMessageInput,
})
