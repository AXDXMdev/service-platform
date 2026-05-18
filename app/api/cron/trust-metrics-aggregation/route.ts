import { apiError, apiOk } from "@/lib/apiResponse"
import { hasValidCronSecret } from "@/lib/cronAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { getRequestIp } from "@/lib/serverRateLimit"
import { logServerError } from "@/lib/serverLogger"
import { aggregateTrustMetrics } from "@/services/trustMetricsAggregationService"
import { recordSecurityEvent } from "@/services/securityEventService"

type TrustMetricsCronDeps = {
  hasValidCronSecret: typeof hasValidCronSecret
  hasServiceRoleEnv: () => boolean
  createAdminClient: typeof createServerSupabaseAdminClient
  aggregateTrustMetrics: typeof aggregateTrustMetrics
}

const defaultDeps: TrustMetricsCronDeps = {
  hasValidCronSecret,
  hasServiceRoleEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  aggregateTrustMetrics,
}

export function createTrustMetricsAggregationPostHandler(
  overrides: Partial<TrustMetricsCronDeps> = {}
) {
  const deps = { ...defaultDeps, ...overrides }

  return async function POST(request: Request) {
    if (!deps.hasValidCronSecret(request)) {
      const admin = deps.hasServiceRoleEnv() ? deps.createAdminClient() : null
      if (admin) {
        await recordSecurityEvent(admin as never, {
          eventType: "cron_trust_metrics_unauthorized",
          severity: "warning",
          route: "/api/cron/trust-metrics-aggregation",
          ip: getRequestIp(request),
          userAgent: request.headers.get("user-agent"),
        }).catch(() => undefined)
      }
      return apiError(401, "unauthorized", "Cron-Secret erforderlich.")
    }

    if (!deps.hasServiceRoleEnv()) {
      return apiError(503, "configuration_error", "Trust-Metrics-Worker benoetigt SUPABASE_SERVICE_ROLE_KEY.")
    }

    const admin = deps.createAdminClient()
    if (!admin) {
      return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
    }

    try {
      const result = await deps.aggregateTrustMetrics(admin as never)
      return apiOk(result, {
        headers: {
          "Cache-Control": "no-store",
        },
      })
    } catch (error) {
      logServerError("Trust metrics aggregation cron failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      })
      return apiError(500, "upstream_error", "Trust-Metriken konnten nicht aggregiert werden.")
    }
  }
}

export const POST = createTrustMetricsAggregationPostHandler()

export async function GET(request: Request) {
  return POST(request)
}
