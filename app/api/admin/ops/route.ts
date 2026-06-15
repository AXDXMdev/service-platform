import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_ACTOR_COOKIE, ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { loadMarketplaceOpsData } from "@/services/adminOpsService"
import { readJsonBody, requireSameOrigin } from "@/lib/requestSecurity"
import { normalizeText } from "@/lib/validation"
import { isMissingSchemaError } from "@/services/validation"

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

function optionalRows<T>(result: { data: T[] | null; error: { message: string } | null | undefined }) {
  if (result.error && isMissingSchemaError(result.error.message)) return []
  return result.data ?? []
}

function hasRequiredOpsError(result: { error: { message: string } | null | undefined }) {
  return Boolean(result.error && !isMissingSchemaError(result.error.message))
}

type AdminOpsRouteDeps = {
  getAdminCookieValue: () => Promise<string | undefined>
  getAdminActorCookieValue: () => Promise<string | undefined>
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
  getAdminActorCookieValue: async () => {
    const store = await cookies()
    return store.get(ADMIN_ACTOR_COOKIE)?.value
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

    if (
      hasRequiredOpsError(uploads) ||
      hasRequiredOpsError(reports) ||
      hasRequiredOpsError(deletions) ||
      hasRequiredOpsError(securityEvents) ||
      !marketplace.ok
    ) {
      logServerError("Admin ops lookup failed", {
        uploads: uploads.error?.message,
        reports: reports.error?.message,
        deletions: deletions.error?.message,
        securityEvents: securityEvents.error?.message,
        marketplace: marketplace.ok ? undefined : marketplace.message,
      })
      return apiError(500, "upstream_error", "Ops-Daten konnten nicht geladen werden.")
    }

    const uploadRows = optionalRows(uploads)
    const reportRows = optionalRows(reports)
    const deletionRows = optionalRows(deletions)
    const securityRows = optionalRows(securityEvents)
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

type AdminOpsAction = "provider_contacted" | "request_escalated"

function normalizeOpsAction(value: unknown): AdminOpsAction | null {
  const action = normalizeText(typeof value === "string" ? value : "", 60)
  if (action === "provider_contacted" || action === "request_escalated") return action
  return null
}

function priorityForAction(action: AdminOpsAction) {
  return action === "request_escalated" ? "urgent" : "high"
}

function noteForAction(action: AdminOpsAction, note: string | null) {
  const label = action === "request_escalated" ? "OPS ESKALIERT" : "OPS ANBIETER KONTAKTIERT"
  const suffix = note ? `: ${note}` : ""
  return `[${new Date().toISOString()}] ${label}${suffix}`
}

function appendInternalNote(existing: string | null | undefined, nextNote: string) {
  const current = normalizeText(existing ?? "", 5000)
  return current ? `${current}\n${nextNote}` : nextNote
}

export function createAdminOpsPostHandler(overrides: Partial<AdminOpsRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides }

  return async function POST(request: Request) {
    const originError = requireSameOrigin(request)
    if (originError) return originError

    const cookieValue = await deps.getAdminCookieValue()
    if (!deps.hasAdminSession(cookieValue)) {
      return apiError(401, "unauthorized", "Admin-Session erforderlich.")
    }

    if (!deps.hasSupabaseEnv()) {
      return apiError(503, "configuration_error", "Ops-API benötigt SUPABASE_SERVICE_ROLE_KEY.")
    }

    const json = await readJsonBody(request)
    if (!json.ok) return json.response

    const requestId = normalizeText(String(json.body.requestId ?? ""), 80)
    const action = normalizeOpsAction(json.body.action)
    const note = normalizeText(String(json.body.note ?? ""), 500) || null
    if (!requestId || !action) return apiError(400, "bad_request", "Request oder Ops-Aktion fehlt.")

    const supabase = deps.createAdminClient()
    if (!supabase) return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")

    const existing = await supabase
      .from("requests")
      .select("id,internal_notes,priority,status")
      .eq("id", requestId)
      .maybeSingle()

    if (existing.error) {
      logServerError("Admin ops request lookup failed", { error: existing.error.message, requestId })
      return apiError(500, "upstream_error", "Request konnte nicht geladen werden.")
    }

    if (!existing.data) return apiError(404, "not_found", "Request wurde nicht gefunden.")

    const opsNote = noteForAction(action, note)
    const update = await supabase
      .from("requests")
      .update({
        priority: priorityForAction(action),
        internal_notes: appendInternalNote(existing.data.internal_notes, opsNote),
      })
      .eq("id", requestId)
      .select("id,priority,internal_notes")
      .single()

    if (update.error) {
      logServerError("Admin ops request update failed", { error: update.error.message, requestId, action })
      return apiError(500, "upstream_error", "Ops-Aktion konnte nicht gespeichert werden.")
    }

    const actorId = normalizeText((await deps.getAdminActorCookieValue()) ?? "", 80) || null
    const event = await supabase.from("request_events").insert([
      {
        request_id: requestId,
        event_type: action,
        from_status: existing.data.status ?? null,
        to_status: existing.data.status ?? null,
        actor_id: actorId,
        note: opsNote,
      },
    ])

    if (event.error) {
      logServerError("Admin ops event insert failed", { error: event.error.message, requestId, action })
    }

    return apiOk({
      requestId,
      action,
      priority: update.data.priority,
      internalNotes: update.data.internal_notes,
    })
  }
}

export const POST = createAdminOpsPostHandler()
