import { cookies } from "next/headers"
import { apiError, apiOk } from "@/lib/apiResponse"
import { ADMIN_COOKIE, hasValidAdminCookie, isAdminConfigured } from "@/lib/adminSession"
import { logServerError } from "@/lib/serverLogger"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { normalizeText } from "@/lib/validation"

type SupportRequestRow = {
  id: string
  service_id: string
  sender_id: string | null
  sender_email: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  customer_budget_eur: number | null
  provider_offer_eur: number | null
  final_price_eur: number | null
  internal_notes?: string | null
  assigned_to?: string | null
  priority?: string | null
}

type SupportServiceRow = {
  id: string
  title: string
  provider_name: string | null
  user_id: string | null
  city: string | null
}

const MAX_LIMIT = 100

function requireAdminSession(cookieValue: string | undefined) {
  return isAdminConfigured() && hasValidAdminCookie(cookieValue)
}

export async function GET(request: Request) {
  const store = await cookies()
  if (!requireAdminSession(store.get(ADMIN_COOKIE)?.value)) {
    return apiError(401, "unauthorized", "Admin-Session erforderlich.")
  }

  if (!getSupabaseServiceRoleEnv()) {
    return apiError(
      503,
      "configuration_error",
      "Support-API benötigt SUPABASE_SERVICE_ROLE_KEY auf dem Server."
    )
  }

  const supabase = createServerSupabaseAdminClient()
  if (!supabase) {
    return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
  }

  const url = new URL(request.url)
  const search = normalizeText(url.searchParams.get("q") ?? "", 120).toLowerCase()
  const status = normalizeText(url.searchParams.get("status") ?? "", 40)
  const priority = normalizeText(url.searchParams.get("priority") ?? "", 40)
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "50") || 50, 1),
    MAX_LIMIT
  )

  let requestQuery = supabase
    .from("requests")
    .select(
      "id,service_id,sender_id,sender_email,status,created_at,updated_at,customer_budget_eur,provider_offer_eur,final_price_eur,internal_notes,assigned_to,priority"
    )

  if (status) requestQuery = requestQuery.eq("status", status)
  if (priority) requestQuery = requestQuery.eq("priority", priority)

  const requestResult = await requestQuery
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SupportRequestRow[]>()
  if (requestResult.error) {
    logServerError("Support request lookup failed", { error: requestResult.error.message })
    return apiError(500, "upstream_error", "Support-Anfragen konnten nicht geladen werden.")
  }

  const requests = requestResult.data ?? []
  const serviceIds = [...new Set(requests.map((item) => item.service_id).filter(Boolean))]
  const serviceResult =
    serviceIds.length > 0
      ? await supabase
          .from("services")
          .select("id,title,provider_name,user_id,city")
          .in("id", serviceIds)
          .returns<SupportServiceRow[]>()
      : { data: [] as SupportServiceRow[], error: null }

  if (serviceResult.error) {
    logServerError("Support service lookup failed", { error: serviceResult.error.message })
    return apiError(500, "upstream_error", "Support-Service-Daten konnten nicht geladen werden.")
  }

  const servicesById = new Map((serviceResult.data ?? []).map((service) => [service.id, service]))
  const items = requests
    .map((item) => {
      const service = servicesById.get(item.service_id)
      return {
        id: item.id,
        status: item.status ?? "pending",
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priority: item.priority ?? "normal",
        assignedTo: item.assigned_to ?? null,
        internalNotes: item.internal_notes ?? null,
        customer: {
          userId: item.sender_id,
          email: item.sender_email,
        },
        service: service
          ? {
              id: service.id,
              title: service.title,
              providerName: service.provider_name,
              providerUserId: service.user_id,
              city: service.city,
            }
          : null,
        amounts: {
          customerBudgetEur: item.customer_budget_eur,
          providerOfferEur: item.provider_offer_eur,
          finalPriceEur: item.final_price_eur,
        },
      }
    })
    .filter((item) => {
      if (!search) return true
      return [
        item.id,
        item.customer.email,
        item.service?.title,
        item.service?.providerName,
        item.service?.city,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    })

  return apiOk({
    items,
    total: items.length,
    filters: {
      q: search || null,
      status: status || null,
      priority: priority || null,
      limit,
    },
  })
}
