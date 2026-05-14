import { apiError, apiOk } from "@/lib/apiResponse"
import { getRequestIp, isRateLimited } from "@/lib/serverRateLimit"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { createWaitlistEntry } from "@/services/userService"
import { validateWaitlistInput } from "@/services/validation"

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (isRateLimited(`waitlist:${ip}`, 10, 10 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Eintraege in kurzer Zeit. Bitte spaeter erneut.")
  }

  if (!getSupabasePublicEnv()) {
    return apiError(503, "configuration_error", "Warteliste ist momentan nicht verfuegbar.")
  }

  const supabase = createServerSupabasePublicClient()
  if (!supabase) {
    return apiError(503, "configuration_error", "Warteliste ist momentan nicht verfuegbar.")
  }

  const body = await request.json().catch(() => null)
  const parsed = validateWaitlistInput(body)
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
