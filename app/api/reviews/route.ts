import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { getRequestIp, isRateLimited } from "@/lib/serverRateLimit"
import { requireUserContext } from "@/services/authService"
import { createReview } from "@/services/reviewService"
import { validateReviewCreateInput } from "@/services/validation"

type ReviewRouteDeps = {
  getRequestIp: typeof getRequestIp
  isRateLimited: typeof isRateLimited
  requireUserContext: typeof requireUserContext
  createReview: typeof createReview
  validateReviewCreateInput: typeof validateReviewCreateInput
}

export function createReviewsPostHandler(deps: ReviewRouteDeps) {
  return async function POST(request: Request) {
    const ip = deps.getRequestIp(request)
    if (deps.isRateLimited(`reviews:${ip}`, 12, 10 * 60 * 1000)) {
      return apiError(429, "rate_limited", "Zu viele Bewertungsversuche in kurzer Zeit. Bitte spaeter erneut.")
    }

    const auth = await deps.requireUserContext(request)
    if (auth.error || !auth.user || !auth.supabase) return auth.error

    const json = await readJsonBody(request)
    if (!json.ok) return json.response
    const parsed = deps.validateReviewCreateInput(json.body)
    if (!parsed.ok) {
      return apiError(400, "bad_request", parsed.message)
    }

    const result = await deps.createReview(auth.supabase, auth.user, parsed.value)
    if (!result.ok) {
      const code =
        result.status === 403
          ? "forbidden"
          : result.status === 404
            ? "not_found"
            : result.status === 409
              ? "bad_request"
              : result.status >= 500
                ? "upstream_error"
                : "bad_request"
      return apiError(result.status, code, result.message)
    }

    return apiOk(result.data)
  }
}

export const POST = createReviewsPostHandler({
  getRequestIp,
  isRateLimited,
  requireUserContext,
  createReview,
  validateReviewCreateInput,
})
