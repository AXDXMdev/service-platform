import { apiError, apiOk } from "@/lib/apiResponse"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { submitAbuseReport } from "@/services/moderationService"
import { readJsonBody } from "@/lib/requestSecurity"
import { isLikelySpamTrapFilled, isValidEmail, normalizeText } from "@/lib/validation"

const ALLOWED_CATEGORIES = new Set([
  "bug",
  "illegal_content",
  "fraud",
  "harassment",
  "privacy",
  "other",
])

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["abuse-report", ip]), 8, 10 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Meldungen in kurzer Zeit. Bitte spaeter erneut.")
  }

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(
      503,
      "configuration_error",
      "Meldeprozess benoetigt SUPABASE_SERVICE_ROLE_KEY auf dem Server."
    )
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const body = json.body as
    | {
        category?: string
        targetUrl?: string
        targetEntityId?: string
        description?: string
        contactEmail?: string
        website?: string
      }

  const category = normalizeText(body?.category ?? "", 40)
  const targetUrl = normalizeText(body?.targetUrl ?? "", 500)
  const targetEntityId = normalizeText(body?.targetEntityId ?? "", 120)
  const description = normalizeText(body?.description ?? "", 4000)
  const contactEmail = normalizeText(body?.contactEmail ?? "", 200)
  const website = normalizeText(body?.website ?? "", 200)

  if (isLikelySpamTrapFilled(website)) {
    return apiOk({ status: "accepted" })
  }

  if (!ALLOWED_CATEGORIES.has(category) || !description) {
    return apiError(400, "bad_request", "Bitte Kategorie und Beschreibung ausfuellen.")
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return apiError(400, "bad_request", "Bitte eine gueltige Kontakt-E-Mail eingeben.")
  }

  let reporterUserId: string | null = null
  if (getSupabasePublicEnv()) {
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const publicClient = createServerSupabasePublicClient(authHeader)
      const userResult = publicClient ? await publicClient.auth.getUser() : null
      reporterUserId = userResult?.data.user?.id ?? null
    }
  }

  const admin = createServerSupabaseAdminClient()
  if (!admin) {
    return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
  }

  const insertResult = await submitAbuseReport(admin, {
    reporterUserId,
    contactEmail: contactEmail || null,
    category,
    targetUrl: targetUrl || null,
    targetEntityId: targetEntityId || null,
    description,
  })

  if (insertResult.error) {
    logServerError("Abuse report insert failed", {
      category,
      error: insertResult.error.message,
    })
    return apiError(500, "upstream_error", "Meldung konnte nicht gespeichert werden.")
  }

  return apiOk({
    status: "open",
    message: "Danke. Deine Meldung wurde gespeichert und wird intern geprueft.",
  })
}
