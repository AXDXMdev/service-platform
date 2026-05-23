import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { requireAuthenticatedUser } from "@/lib/serverAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import {
  enqueueUploadPostProcessing,
  validateUploadCompleteInput,
} from "@/services/uploadPostProcessingService"

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.error || !auth.user) return auth.error

  if (
    await isRateLimitedAsync(
      buildRateLimitKey(["upload-complete", getRequestIp(request), auth.user.id]),
      40,
      10 * 60 * 1000
    )
  ) {
    return apiError(429, "rate_limited", "Zu viele Upload-Prüfungen in kurzer Zeit.")
  }

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(503, "configuration_error", "Upload-Prüfung ist gerade nicht verfügbar.")
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response

  const parsed = validateUploadCompleteInput(json.body)
  if (!parsed.ok) return apiError(parsed.status, "bad_request", parsed.message)

  const admin = createServerSupabaseAdminClient()
  if (!admin) return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")

  const result = await enqueueUploadPostProcessing(admin as never, auth.user, parsed.value)
  if (!result.ok) {
    const code = result.status === 403 ? "forbidden" : result.status === 404 ? "not_found" : "upstream_error"
    return apiError(result.status, code, result.message)
  }

  return apiOk(result.data)
}
