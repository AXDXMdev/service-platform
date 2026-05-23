import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError } from "@/lib/serverLogger"
import { normalizeText } from "@/lib/validation"

function requireAdminSession(cookieValue: string | undefined) {
  return isAdminConfigured() && hasValidAdminCookie(cookieValue)
}

export async function GET(request: Request) {
  const store = await cookies()
  if (!requireAdminSession(store.get(ADMIN_COOKIE)?.value)) {
    return apiError(401, "unauthorized", "Admin-Session erforderlich.")
  }

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(503, "configuration_error", "Compliance-API benötigt SUPABASE_SERVICE_ROLE_KEY.")
  }

  const supabase = createServerSupabaseAdminClient()
  if (!supabase) {
    return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
  }

  const url = new URL(request.url)
  const q = normalizeText(url.searchParams.get("q") ?? "", 120).toLowerCase()

  const [reportResult, deletionResult] = await Promise.all([
    supabase
      .from("abuse_reports")
      .select("id,reporter_user_id,contact_email,category,target_url,target_entity_id,description,status,assigned_to,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("account_deletion_requests")
      .select("id,user_id,email,reason,status,requested_at,processed_at,mode")
      .order("requested_at", { ascending: false })
      .limit(100),
  ])

  if (reportResult.error || deletionResult.error) {
    logServerError("Compliance admin lookup failed", {
      reportsError: reportResult.error?.message,
      deletionsError: deletionResult.error?.message,
    })
    return apiError(500, "upstream_error", "Compliance-Daten konnten nicht geladen werden.")
  }

  const reports = (reportResult.data ?? []).filter((item) => {
    if (!q) return true
    return [item.contact_email, item.category, item.target_url, item.target_entity_id, item.description]
      .join(" ")
      .toLowerCase()
      .includes(q)
  })

  const deletionRequests = (deletionResult.data ?? []).filter((item) => {
    if (!q) return true
    return [item.email, item.reason, item.status, item.mode].join(" ").toLowerCase().includes(q)
  })

  return apiOk({
    reports,
    deletionRequests,
  })
}
