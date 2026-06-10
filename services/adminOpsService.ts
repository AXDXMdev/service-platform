import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type SupabaseAdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

type OpsRequestRow = {
  id: string
  service_id: string | null
  sender_email: string | null
  status: string | null
  created_at: string | null
  updated_at?: string | null
  first_provider_response_at?: string | null
  customer_budget_eur?: number | null
  preferred_date?: string | null
  request_location?: string | null
  provider_id?: string | null
  customer_id?: string | null
  first_message?: string | null
}

type OpsServiceRow = {
  id: string
  title: string | null
  provider_name: string | null
  user_id: string | null
  city: string | null
  district: string | null
  is_verified?: boolean | null
  is_active?: boolean | null
}

type OpsMessageRow = {
  id: string
  request_id: string
  sender_id: string | null
  receiver_id?: string | null
  body?: string | null
  message?: string | null
  created_at: string | null
}

export type RequestSlaTone = "normal" | "watch" | "critical" | "lost"

export type UnansweredRequestOpsItem = {
  id: string
  serviceId: string | null
  serviceTitle: string
  providerId: string | null
  providerName: string
  providerCity: string | null
  customerEmail: string | null
  status: string
  createdAt: string | null
  updatedAt: string | null
  ageHours: number
  slaTone: RequestSlaTone
  firstMessagePreview: string | null
  budgetEur: number | null
  preferredDate: string | null
  requestLocation: string | null
  lastCustomerMessageAt: string | null
  recommendedAction: string
}

export type ProviderSlaRiskItem = {
  providerId: string
  providerName: string
  city: string | null
  unansweredCount: number
  criticalCount: number
  oldestAgeHours: number
  serviceTitles: string[]
}

export type MarketplaceOpsPayload = {
  generatedAt: string
  sla: {
    openUnanswered: number
    watch: number
    critical: number
    lost: number
    answeredWithin4hLast7d: number
    responseRate4hLast7d: number | null
    recentRequestCount: number
  }
  unansweredRequests: UnansweredRequestOpsItem[]
  providerRisks: ProviderSlaRiskItem[]
}

function hoursSince(value: string | null | undefined, nowMs: number) {
  if (!value) return 0
  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return 0
  return Math.max(0, Number(((nowMs - then) / 36e5).toFixed(1)))
}

function slaTone(ageHours: number): RequestSlaTone {
  if (ageHours >= 24) return "lost"
  if (ageHours >= 4) return "critical"
  if (ageHours >= 1) return "watch"
  return "normal"
}

function recommendedAction(tone: RequestSlaTone) {
  if (tone === "lost") return "Telefonisch retten oder Request als verloren markieren."
  if (tone === "critical") return "Anbieter sofort erinnern oder manuell neu zuweisen."
  if (tone === "watch") return "Anbieter erinnern, bevor die 4h-SLA reißt."
  return "Beobachten. Noch innerhalb der SLA."
}

function preview(value: string | null | undefined) {
  const clean = (value ?? "").trim().replace(/\s+/g, " ")
  if (!clean) return null
  return clean.length > 140 ? `${clean.slice(0, 137)}...` : clean
}

function hasProviderResponse(
  request: OpsRequestRow,
  service: OpsServiceRow | undefined,
  messages: OpsMessageRow[]
) {
  if (request.first_provider_response_at) return true
  const providerId = request.provider_id ?? service?.user_id ?? null
  if (!providerId) return false
  return messages.some((message) => message.request_id === request.id && message.sender_id === providerId)
}

function firstProviderResponseAt(
  request: OpsRequestRow,
  service: OpsServiceRow | undefined,
  messages: OpsMessageRow[]
) {
  if (request.first_provider_response_at) return request.first_provider_response_at
  const providerId = request.provider_id ?? service?.user_id ?? null
  if (!providerId) return null
  return (
    messages
      .filter((message) => message.request_id === request.id && message.sender_id === providerId && message.created_at)
      .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())[0]
      ?.created_at ?? null
  )
}

export async function loadMarketplaceOpsData(
  supabase: SupabaseAdminClient,
  now = new Date()
): Promise<{ ok: true; data: MarketplaceOpsPayload } | { ok: false; status: number; message: string }> {
  const nowMs = now.getTime()
  const since7d = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString()

  const requestsQuery = await supabase
    .from("requests")
    .select("id,service_id,sender_email,status,created_at,updated_at,first_provider_response_at,customer_budget_eur,preferred_date,request_location,provider_id,customer_id,first_message")
    .neq("status", "deleted")
    .gte("created_at", since7d)
    .order("created_at", { ascending: false })
    .limit(250)
    .returns<OpsRequestRow[]>()

  if (requestsQuery.error) {
    return { ok: false, status: 500, message: "Marketplace-Requests konnten nicht geladen werden." }
  }

  const requests = requestsQuery.data ?? []
  const serviceIds = [...new Set(requests.map((request) => request.service_id).filter(Boolean))] as string[]
  const requestIds = requests.map((request) => request.id)

  const [servicesQuery, messagesQuery] = await Promise.all([
    serviceIds.length > 0
      ? supabase
          .from("services")
          .select("id,title,provider_name,user_id,city,district,is_verified,is_active")
          .in("id", serviceIds)
          .returns<OpsServiceRow[]>()
      : Promise.resolve({ data: [] as OpsServiceRow[], error: null }),
    requestIds.length > 0
      ? supabase
          .from("chat_messages")
          .select("id,request_id,sender_id,receiver_id,body,message,created_at")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false })
          .returns<OpsMessageRow[]>()
      : Promise.resolve({ data: [] as OpsMessageRow[], error: null }),
  ])

  if (servicesQuery.error || messagesQuery.error) {
    return { ok: false, status: 500, message: "Marketplace-Ops-Daten konnten nicht vollständig geladen werden." }
  }

  const servicesById = new Map((servicesQuery.data ?? []).map((service) => [service.id, service]))
  const messages = messagesQuery.data ?? []
  const activeRequests = requests.filter((request) => ["pending", "accepted"].includes(request.status ?? "pending"))
  const unanswered = activeRequests.filter((request) => !hasProviderResponse(request, servicesById.get(request.service_id ?? ""), messages))

  const unansweredRequests = unanswered
    .map((request): UnansweredRequestOpsItem => {
      const service = servicesById.get(request.service_id ?? "")
      const ageHours = hoursSince(request.created_at, nowMs)
      const tone = slaTone(ageHours)
      const providerId = request.provider_id ?? service?.user_id ?? null
      const providerName = service?.provider_name || (providerId ? providerId.slice(0, 8) : "Unbekannter Anbieter")
      const requestMessages = messages.filter((message) => message.request_id === request.id)
      const lastCustomerMessage = requestMessages.find((message) => message.sender_id !== providerId)

      return {
        id: request.id,
        serviceId: request.service_id,
        serviceTitle: service?.title || "Unbekannter Service",
        providerId,
        providerName,
        providerCity: service?.city ?? null,
        customerEmail: request.sender_email,
        status: request.status ?? "pending",
        createdAt: request.created_at,
        updatedAt: request.updated_at ?? null,
        ageHours,
        slaTone: tone,
        firstMessagePreview: preview(request.first_message),
        budgetEur: request.customer_budget_eur ?? null,
        preferredDate: request.preferred_date ?? null,
        requestLocation: request.request_location ?? null,
        lastCustomerMessageAt: lastCustomerMessage?.created_at ?? request.created_at,
        recommendedAction: recommendedAction(tone),
      }
    })
    .sort((a, b) => b.ageHours - a.ageHours)

  const providerRisks = Array.from(
    unansweredRequests.reduce<Map<string, ProviderSlaRiskItem>>((acc, request) => {
      if (!request.providerId) return acc
      const current =
        acc.get(request.providerId) ??
        {
          providerId: request.providerId,
          providerName: request.providerName,
          city: request.providerCity,
          unansweredCount: 0,
          criticalCount: 0,
          oldestAgeHours: 0,
          serviceTitles: [],
        }

      current.unansweredCount += 1
      if (request.slaTone === "critical" || request.slaTone === "lost") current.criticalCount += 1
      current.oldestAgeHours = Math.max(current.oldestAgeHours, request.ageHours)
      if (!current.serviceTitles.includes(request.serviceTitle)) current.serviceTitles.push(request.serviceTitle)
      acc.set(request.providerId, current)
      return acc
    }, new Map()).values()
  ).sort((a, b) => b.criticalCount - a.criticalCount || b.oldestAgeHours - a.oldestAgeHours)

  const answeredWithin4h = requests.filter((request) => {
    const service = servicesById.get(request.service_id ?? "")
    const responseAt = firstProviderResponseAt(request, service, messages)
    if (!responseAt || !request.created_at) return false
    return hoursSince(request.created_at, new Date(responseAt).getTime()) <= 4
  }).length

  return {
    ok: true,
    data: {
      generatedAt: now.toISOString(),
      sla: {
        openUnanswered: unansweredRequests.length,
        watch: unansweredRequests.filter((request) => request.slaTone === "watch").length,
        critical: unansweredRequests.filter((request) => request.slaTone === "critical").length,
        lost: unansweredRequests.filter((request) => request.slaTone === "lost").length,
        answeredWithin4hLast7d: answeredWithin4h,
        responseRate4hLast7d: requests.length > 0 ? Number(((answeredWithin4h / requests.length) * 100).toFixed(1)) : null,
        recentRequestCount: requests.length,
      },
      unansweredRequests,
      providerRisks,
    },
  }
}
