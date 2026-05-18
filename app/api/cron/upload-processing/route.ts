import { apiError, apiOk } from "@/lib/apiResponse"
import { hasValidCronSecret } from "@/lib/cronAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { getRequestIp } from "@/lib/serverRateLimit"
import { logServerError } from "@/lib/serverLogger"
import { processQueuedUploadJobs } from "@/services/uploadPostProcessingService"
import { recordSecurityEvent } from "@/services/securityEventService"

export async function POST(request: Request) {
  if (!hasValidCronSecret(request)) {
    const admin = getSupabaseServiceRoleEnv() ? createServerSupabaseAdminClient() : null
    if (admin) {
      await recordSecurityEvent(admin, {
        eventType: "cron_upload_processing_unauthorized",
        severity: "warning",
        route: "/api/cron/upload-processing",
        ip: getRequestIp(request),
        userAgent: request.headers.get("user-agent"),
      }).catch(() => undefined)
    }
    return apiError(401, "unauthorized", "Cron-Secret erforderlich.")
  }

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(503, "configuration_error", "Upload-Worker benoetigt SUPABASE_SERVICE_ROLE_KEY.")
  }

  const admin = createServerSupabaseAdminClient()
  if (!admin) return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")

  const result = await processQueuedUploadJobs(admin as never)
  if (!result.ok) {
    logServerError("Upload processing cron failed", { message: result.message })
    return apiError(result.status, "upstream_error", result.message)
  }

  return apiOk(result.data, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

export async function GET(request: Request) {
  return POST(request)
}
