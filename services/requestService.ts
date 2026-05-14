import type { User } from "@supabase/supabase-js"
import { canCustomerTransition, canProviderTransition, type RequestStatus } from "@/services/requestRules"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { isMissingSchemaError } from "@/services/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

async function getRequestWithService(supabase: SupabasePublicClient, requestId: string) {
  let query = await supabase
    .from("requests")
    .select("id,status,sender_id,service_id,provider_offer_eur,final_price_eur")
    .eq("id", requestId)
    .single()

  if (query.error && isMissingSchemaError(query.error.message)) {
    query = await supabase
      .from("requests")
      .select("id,status,sender_id,service_id")
      .eq("id", requestId)
      .single()
  }

  return query
}

async function getProviderUserIdForService(supabase: SupabasePublicClient, serviceId: string | null) {
  if (!serviceId) return { ok: false as const, status: 404, message: "Service zur Anfrage fehlt.", providerUserId: null }

  const serviceQuery = await supabase
    .from("services")
    .select("id,user_id")
    .eq("id", serviceId)
    .single()

  if (serviceQuery.error || !serviceQuery.data) {
    return {
      ok: false as const,
      status: 404,
      message: "Service zur Anfrage wurde nicht gefunden.",
      providerUserId: null,
    }
  }

  return {
    ok: true as const,
    providerUserId: serviceQuery.data.user_id ?? null,
  }
}

export async function createRequest(
  supabase: SupabasePublicClient,
  user: User,
  input: { serviceId: string; customerBudgetEur: number | null }
) {
  const service = await supabase
    .from("services")
    .select("id,user_id")
    .eq("id", input.serviceId)
    .single()

  if (service.error || !service.data) {
    return { ok: false as const, status: 404, message: "Service wurde nicht gefunden." }
  }

  if (service.data.user_id === user.id) {
    return { ok: false as const, status: 403, message: "Du kannst keinen eigenen Service anfragen." }
  }

  let insert = await supabase
    .from("requests")
    .insert([
      {
        service_id: input.serviceId,
        sender_id: user.id,
        sender_email: user.email ?? null,
        customer_budget_eur: input.customerBudgetEur,
      },
    ])
    .select("*")
    .single()

  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase
      .from("requests")
      .insert([
        {
          service_id: input.serviceId,
          sender_id: user.id,
          sender_email: user.email ?? null,
        },
      ])
      .select("*")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Anfrage konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data }
}

export async function updateRequestStatus(
  supabase: SupabasePublicClient,
  user: User,
  input: { requestId: string; nextStatus: RequestStatus; note?: string | null }
) {
  const requestQuery = await getRequestWithService(supabase, input.requestId)
  if (requestQuery.error || !requestQuery.data) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  const request = requestQuery.data as {
    id: string
    status: RequestStatus | null
    sender_id: string | null
    service_id: string | null
    provider_offer_eur?: number | null
    final_price_eur?: number | null
  }

  const providerLookup = await getProviderUserIdForService(supabase, request.service_id)
  if (!providerLookup.ok) {
    return { ok: false as const, status: providerLookup.status, message: providerLookup.message }
  }

  const isCustomer = request.sender_id === user.id
  const isProvider = providerLookup.providerUserId === user.id

  if (!isCustomer && !isProvider) {
    return { ok: false as const, status: 403, message: "Keine Berechtigung fuer diese Anfrage." }
  }

  const allowed = isProvider
    ? canProviderTransition(request.status, input.nextStatus)
    : canCustomerTransition(request.status, input.nextStatus)

  if (!allowed && input.nextStatus !== "deleted") {
    return { ok: false as const, status: 400, message: "Dieser Statuswechsel ist nicht erlaubt." }
  }

  const payload: Record<string, unknown> = { status: input.nextStatus }
  if (input.nextStatus === "deleted") payload.deleted_at = new Date().toISOString()
  if (input.nextStatus === "completed") {
    payload.finalized_at = new Date().toISOString()
    if (request.provider_offer_eur != null && request.final_price_eur == null) {
      payload.final_price_eur = request.provider_offer_eur
    }
  }

  let update = await supabase.from("requests").update(payload).eq("id", input.requestId).select("*").single()
  if (update.error && isMissingSchemaError(update.error.message)) {
    update = await supabase
      .from("requests")
      .update({ status: input.nextStatus })
      .eq("id", input.requestId)
      .select("*")
      .single()
  }

  if (update.error) {
    return { ok: false as const, status: 500, message: "Status konnte nicht aktualisiert werden." }
  }

  const event = await supabase.from("request_events").insert([
    {
      request_id: input.requestId,
      event_type: "status_changed",
      from_status: request.status,
      to_status: input.nextStatus,
      actor_id: user.id,
      note: input.note ?? null,
    },
  ])

  if (event.error && !isMissingSchemaError(event.error.message)) {
    return { ok: false as const, status: 500, message: "Status wurde geaendert, aber Event-Log fehlgeschlagen." }
  }

  return { ok: true as const, data: update.data }
}

export async function updateProviderOffer(
  supabase: SupabasePublicClient,
  user: User,
  input: { requestId: string; providerOfferEur: number }
) {
  const requestQuery = await getRequestWithService(supabase, input.requestId)
  if (requestQuery.error || !requestQuery.data) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  const request = requestQuery.data as {
    service_id: string | null
  }

  const providerLookup = await getProviderUserIdForService(supabase, request.service_id)
  if (!providerLookup.ok) {
    return { ok: false as const, status: providerLookup.status, message: providerLookup.message }
  }

  if (providerLookup.providerUserId !== user.id) {
    return { ok: false as const, status: 403, message: "Nur der Anbieter kann ein Preisangebot setzen." }
  }

  const update = await supabase
    .from("requests")
    .update({ provider_offer_eur: input.providerOfferEur })
    .eq("id", input.requestId)
    .select("*")
    .single()

  if (update.error) {
    return { ok: false as const, status: 500, message: "Preisangebot konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: update.data }
}
