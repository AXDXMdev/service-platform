import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { createWaitlistEntry } from "@/services/userService"
import { validateWaitlistInput } from "@/services/validation"

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["waitlist", ip]), 10, 10 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Einträge in kurzer Zeit. Bitte später erneut.")
  }

  if (!getSupabasePublicEnv()) {
    return apiError(503, "configuration_error", "Warteliste ist momentan nicht verfügbar.")
  }

  const supabase = createServerSupabasePublicClient()
  if (!supabase) {
    return apiError(503, "configuration_error", "Warteliste ist momentan nicht verfügbar.")
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = validateWaitlistInput(json.body)
  if (!parsed.ok) {
    return apiError(400, "bad_request", parsed.message)
  }

  const result = await createWaitlistEntry(supabase, parsed.value)
  if (!result.ok) {
    return apiError(result.status, "upstream_error", result.message)
  }

  return apiOk({
    status: "saved",
    id: result.data.id,
  })
}
