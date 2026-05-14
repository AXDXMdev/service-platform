import { apiError, apiOk } from "@/lib/apiResponse"
import { requireUserContext } from "@/services/authService"
import { updateProviderOffer } from "@/services/requestService"
import { validateProviderOfferInput } from "@/services/validation"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserContext(request)
  if (auth.error || !auth.user || !auth.supabase) return auth.error

  const params = await context.params
  const body = await request.json().catch(() => null)
  const parsed = validateProviderOfferInput(body)
  if (!parsed.ok) {
    return apiError(400, "bad_request", parsed.message)
  }

  const result = await updateProviderOffer(auth.supabase, auth.user, {
    requestId: params.id,
    providerOfferEur: parsed.value.providerOfferEur,
  })

  if (!result.ok) {
    const code =
      result.status === 403 ? "forbidden" : result.status === 404 ? "not_found" : "upstream_error"
    return apiError(result.status, code, result.message)
  }

  return apiOk(result.data)
}
