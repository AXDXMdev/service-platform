import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { requireUserContext } from "@/services/authService"
import { submitProviderVerification } from "@/services/providerService"
import { validateProviderVerificationInput } from "@/services/validation"

export async function POST(request: Request) {
  const auth = await requireUserContext(request)
  if (auth.error || !auth.user || !auth.supabase) return auth.error

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = validateProviderVerificationInput(json.body, auth.user.email ?? null)
  if (!parsed.ok) {
    return apiError(400, "bad_request", parsed.message)
  }

  const result = await submitProviderVerification(auth.supabase, auth.user, parsed.value)
  if (!result.ok) {
    return apiError(result.status, "upstream_error", result.message)
  }

  return apiOk(result.data)
}
