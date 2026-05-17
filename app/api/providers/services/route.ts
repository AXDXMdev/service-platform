import { apiError, apiOk } from "@/lib/apiResponse"
import { pilotCityLabel } from "@/lib/pilotMode"
import { readJsonBody } from "@/lib/requestSecurity"
import { requireUserContext } from "@/services/authService"
import { createServiceListing } from "@/services/providerService"
import { validateServiceCreateInput } from "@/services/validation"

export async function POST(request: Request) {
  const auth = await requireUserContext(request)
  if (auth.error || !auth.user || !auth.supabase) return auth.error

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = validateServiceCreateInput(json.body)
  if (!parsed.ok) {
    if (parsed.message === "pilot_only") {
      return apiError(
        409,
        "forbidden",
        `Diese Stadt ist noch nicht im Pilot. Aktuelle Pilot-Staedte: ${pilotCityLabel()}.`
      )
    }
    return apiError(400, "bad_request", parsed.message)
  }

  const result = await createServiceListing(auth.supabase, auth.user, parsed.value)
  if (!result.ok) {
    return apiError(result.status, "upstream_error", result.message)
  }

  return apiOk(result.data)
}
