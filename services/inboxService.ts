import type { User } from "@supabase/supabase-js"
import type { ChatMessage, Review, Service, ServiceRequest } from "@/app/types"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { normalizeText } from "@/lib/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export type InboxRequestSummary = ServiceRequest & {
  role: "customer" | "provider"
  unread_count: number
  last_message: ChatMessage | null
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values())
}

function isArchivedStatus(status: string | null | undefined) {
  return status === "deleted"
}

export async function loadInboxData(supabase: SupabasePublicClient, user: User) {
  const ownedServicesResult = await supabase
    .from("services")
    .select("*")
    .eq("user_id", user.id)
    .returns<Service[]>()

  if (ownedServicesResult.error) {
    return { ok: false as const, status: 500, message: "Services konnten nicht geladen werden." }
  }

  const ownedServices = ownedServicesResult.data ?? []
  const serviceIds = ownedServices.map((service) => service.id)

  const customerRequestsResult = await supabase
    .from("requests")
    .select("*")
    .eq("sender_id", user.id)
    .neq("status", "deleted")
    .returns<ServiceRequest[]>()

  if (customerRequestsResult.error) {
    return { ok: false as const, status: 500, message: "Eigene Anfragen konnten nicht geladen werden." }
  }

  const providerRequestsResult =
    serviceIds.length > 0
      ? await supabase
          .from("requests")
          .select("*")
          .in("service_id", serviceIds)
          .neq("status", "deleted")
          .returns<ServiceRequest[]>()
      : { data: [] as ServiceRequest[], error: null }

  if (providerRequestsResult.error) {
    return { ok: false as const, status: 500, message: "Provider-Anfragen konnten nicht geladen werden." }
  }

  const requests = uniqueById([
    ...(customerRequestsResult.data ?? []),
    ...(providerRequestsResult.data ?? []),
  ]).filter((request) => !isArchivedStatus(request.status))

  const allServiceIds = [
    ...new Set([...serviceIds, ...requests.map((request) => request.service_id).filter(Boolean)]),
  ]

  const servicesResult =
    allServiceIds.length > 0
      ? await supabase.from("services").select("*").in("id", allServiceIds).returns<Service[]>()
      : { data: [] as Service[], error: null }

  if (servicesResult.error) {
    return { ok: false as const, status: 500, message: "Service-Daten konnten nicht geladen werden." }
  }

  const requestIds = requests.map((request) => request.id)
  const messagesResult =
    requestIds.length > 0
      ? await supabase
          .from("chat_messages")
          .select("*")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false })
          .returns<ChatMessage[]>()
      : { data: [] as ChatMessage[], error: null }

  if (messagesResult.error) {
    return { ok: false as const, status: 500, message: "Nachrichten konnten nicht geladen werden." }
  }

  const messages = messagesResult.data ?? []
  const summaries = requests.map((request): InboxRequestSummary => {
    const requestMessages = messages.filter((message) => message.request_id === request.id)
    const role = request.sender_id === user.id || request.customer_id === user.id ? "customer" : "provider"
    const unreadCount = requestMessages.filter(
      (message) => message.receiver_id === user.id && !message.read_at
    ).length

    return {
      ...request,
      role,
      unread_count: unreadCount,
      last_message: requestMessages[0] ?? null,
    }
  })

  const reviewResult = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewer_id", user.id)
    .returns<Review[]>()

  if (reviewResult.error) {
    return { ok: false as const, status: 500, message: "Bewertungen konnten nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      requests: summaries,
      services: servicesResult.data ?? [],
      reviews: reviewResult.data ?? [],
    },
  }
}

export async function loadRequestDetail(
  supabase: SupabasePublicClient,
  user: User,
  requestId: string
) {
  const cleanRequestId = normalizeText(requestId, 80)
  if (!cleanRequestId) return { ok: false as const, status: 400, message: "Anfrage fehlt." }

  const requestResult = await supabase
    .from("requests")
    .select("*")
    .eq("id", cleanRequestId)
    .maybeSingle()

  if (requestResult.error || !requestResult.data) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  const request = requestResult.data as ServiceRequest
  const serviceResult = await supabase
    .from("services")
    .select("*")
    .eq("id", request.service_id)
    .maybeSingle()

  if (serviceResult.error || !serviceResult.data) {
    return { ok: false as const, status: 404, message: "Service wurde nicht gefunden." }
  }

  const service = serviceResult.data as Service
  const role =
    request.sender_id === user.id || request.customer_id === user.id
      ? "customer"
      : service.user_id === user.id || request.provider_id === user.id
        ? "provider"
        : null

  if (!role) return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }

  const messageResult = await supabase
    .from("chat_messages")
    .select("*")
    .eq("request_id", cleanRequestId)
    .order("created_at", { ascending: true })
    .returns<ChatMessage[]>()

  if (messageResult.error) {
    return { ok: false as const, status: 500, message: "Nachrichten konnten nicht geladen werden." }
  }

  const reviewResult = await supabase
    .from("reviews")
    .select("*")
    .eq("request_id", cleanRequestId)
    .eq("reviewer_id", user.id)
    .maybeSingle()

  if (reviewResult.error) {
    return { ok: false as const, status: 500, message: "Bewertung konnte nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      role,
      request,
      service,
      messages: messageResult.data ?? [],
      review: (reviewResult.data as Review | null) ?? null,
    },
  }
}

export async function markRequestMessagesRead(
  supabase: SupabasePublicClient,
  user: User,
  requestId: string
) {
  const detail = await loadRequestDetail(supabase, user, requestId)
  if (!detail.ok) return detail

  const update = await supabase
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("request_id", detail.data.request.id)
    .eq("receiver_id", user.id)
    .is("read_at", null)

  if (update.error) {
    return { ok: false as const, status: 500, message: "Gelesen-Status konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: { requestId: detail.data.request.id } }
}
