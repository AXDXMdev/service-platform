import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { loadMarketplaceOpsData } from "@/services/adminOpsService"

function requireAdminSession(cookieValue: string | undefined) {
  return isAdminConfigured() && hasValidAdminCookie(cookieValue)
}

function countByStatus<T extends { status?: string | null }>(rows: T[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const status = row.status ?? "unknown"
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
}

type AdminOpsRouteDeps = {
  getAdminCookieValue: () => Promise<string | undefined>
  hasAdminSession: (cookieValue: string | undefined) => boolean
  hasSupabaseEnv: () => boolean
  createAdminClient: () => ReturnType<typeof createServerSupabaseAdminClient>
  loadMarketplaceOpsData: typeof loadMarketplaceOpsData
}

const defaultDeps: AdminOpsRouteDeps = {
  getAdminCookieValue: async () => {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value
  },
  hasAdminSession: requireAdminSession,
  hasSupabaseEnv: () => Boolean(getSupabaseServiceRoleEnv()),
  createAdminClient: createServerSupabaseAdminClient,
  loadMarketplaceOpsData,
}

export function createAdminOpsGetHandler(overrides: Partial<AdminOpsRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function GET() {
    const cookieValue = await deps.getAdminCookieValue()
    if (!deps.hasAdminSession(cookieValue)) {
      return apiError(401, "unauthorized", "Admin-Session erforderlich.")
    }

    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Ops-API benötigt SUPABASE_SERVICE_ROLE_KEY.")
    }

    const supabase = deps.createAdminClient()
    if (!supabase) return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [uploads, reports, deletions, securityEvents, marketplace] = await Promise.all([
      supabase
        .from("upload_processing_jobs")
        .select("id,status,created_at,updated_at,error_message")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("abuse_reports")
        .select("id,status,category,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("account_deletion_requests")
        .select("id,status,requested_at,processed_at,mode")
        .order("requested_at", { ascending: false })
        .limit(50),
      supabase
        .from("security_events")
        .select("id,event_type,severity,route,created_at")
        .gte("created_at", since24h)
        .order("created_at", { ascending: false })
        .limit(100),
      deps.loadMarketplaceOpsData(supabase),
    ])

    if (uploads.error || reports.error || deletions.error || securityEvents.error || !marketplace.ok) {
      logServerError("Admin ops lookup failed", {
        uploads: uploads.error?.message,
        reports: reports.error?.message,
        deletions: deletions.error?.message,
        securityEvents: securityEvents.error?.message,
        marketplace: marketplace.ok ? undefined : marketplace.message,
      })
      return apiError(500, "upstream_error", "Ops-Daten konnten nicht geladen werden.")
    }

    const uploadRows = uploads.data ?? []
    const reportRows = reports.data ?? []
    const deletionRows = deletions.data ?? []
    const securityRows = securityEvents.data ?? []
    const criticalSecurityEvents = securityRows.filter((event) => event.severity === "critical").length
    const warningSecurityEvents = securityRows.filter((event) => event.severity === "warning").length

    return apiOk(
      {
        generatedAt: new Date().toISOString(),
        uploads: {
          totalRecent: uploadRows.length,
          byStatus: countByStatus(uploadRows),
          failedRecent: uploadRows.filter((job) => job.status === "failed" || job.status === "quarantined").slice(0, 10),
        },
        abuse: {
          totalRecent: reportRows.length,
          byStatus: countByStatus(reportRows),
          byCategory: reportRows.reduce<Record<string, number>>((acc, report) => {
            const category = report.category ?? "unknown"
            acc[category] = (acc[category] ?? 0) + 1
            return acc
          }, {}),
        },
        deletionRequests: {
          totalRecent: deletionRows.length,
          byStatus: countByStatus(deletionRows),
        },
        security: {
          last24h: securityRows.length,
          warnings: warningSecurityEvents,
          critical: criticalSecurityEvents,
          latest: securityRows.slice(0, 20),
        },
        marketplace: marketplace.data,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}

export const GET = createAdminOpsGetHandler()
