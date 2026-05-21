import type { User } from "@supabase/supabase-js"
import { canCustomerTransition, canProviderTransition, type RequestStatus } from "@/services/requestRules"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { isMissingSchemaError } from "@/services/validation"
import { createNotification } from "@/services/notificationService"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

async function getRequestWithService(supabase: SupabasePublicClient, requestId: string) {
  let query = await supabase
    .from("requests")
    .select("id,status,sender_id,customer_id,provider_id,service_id,provider_offer_eur,final_price_eur")
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
  input: {
    serviceId: string
    message: string
    customerBudgetEur: number | null
    preferredDate?: string | null
    location?: string | null
    contactPreference?: string | null
  }
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

  const providerId = service.data.user_id as string | null

  let insert = await supabase
    .from("requests")
    .insert([
      {
        service_id: input.serviceId,
        sender_id: user.id,
        customer_id: user.id,
        provider_id: providerId,
        sender_email: user.email ?? null,
        customer_budget_eur: input.customerBudgetEur,
        first_message: input.message,
        preferred_date: input.preferredDate ?? null,
        request_location: input.location ?? null,
        contact_preference: input.contactPreference ?? null,
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
          customer_budget_eur: input.customerBudgetEur,
        },
      ])
      .select("*")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Anfrage konnte nicht gespeichert werden." }
  }

  await insertInitialMessage(supabase, {
    requestId: insert.data.id,
    senderId: user.id,
    receiverId: providerId,
    message: input.message,
  })

  await createNotification({
    userId: providerId,
    actorId: user.id,
    type: "new_request",
    requestId: insert.data.id,
    serviceId: input.serviceId,
    title: "Neue Anfrage erhalten",
    body: "Ein Kunde hat deinen Service angefragt.",
  })

  return { ok: true as const, data: insert.data }
}

async function insertInitialMessage(
  supabase: SupabasePublicClient,
  input: { requestId: string; senderId: string; receiverId: string | null; message: string }
) {
  let insert = await supabase
    .from("chat_messages")
    .insert([
      {
        request_id: input.requestId,
        sender_id: input.senderId,
        receiver_id: input.receiverId,
        message: input.message,
        body: input.message,
      },
    ])
    .select("*")
    .single()

  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase
      .from("chat_messages")
      .insert([
        {
          request_id: input.requestId,
          sender_id: input.senderId,
          message: input.message,
        },
      ])
      .select("*")
      .single()
  }

  return insert
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
    customer_id?: string | null
    provider_id?: string | null
    service_id: string | null
    provider_offer_eur?: number | null
    final_price_eur?: number | null
  }

  const providerLookup = await getProviderUserIdForService(supabase, request.service_id)
  if (!providerLookup.ok) {
    return { ok: false as const, status: providerLookup.status, message: providerLookup.message }
  }

  const isCustomer = request.sender_id === user.id || request.customer_id === user.id
  const isProvider = request.provider_id === user.id || providerLookup.providerUserId === user.id

  if (!isCustomer && !isProvider) {
    return { ok: false as const, status: 403, message: "Keine Berechtigung für diese Anfrage." }
  }

  const allowed = isProvider
    ? canProviderTransition(request.status, input.nextStatus)
    : canCustomerTransition(request.status, input.nextStatus)

  if (!allowed && input.nextStatus !== "deleted") {
    return { ok: false as const, status: 400, message: "Dieser Statuswechsel ist nicht erlaubt." }
  }

  const payload: Record<string, unknown> = { status: input.nextStatus }
  if (input.nextStatus === "deleted") payload.deleted_at = new Date().toISOString()
  if (input.nextStatus === "cancelled") payload.cancelled_at = new Date().toISOString()
  if (input.nextStatus === "declined" || input.nextStatus === "rejected") {
    payload.declined_at = new Date().toISOString()
    payload.decline_reason = input.note ?? null
  }
  if (input.nextStatus === "completed") {
    payload.completed_at = new Date().toISOString()
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

  await insertSystemMessage(supabase, {
    requestId: input.requestId,
    senderId: user.id,
    receiverId: isProvider ? request.sender_id : providerLookup.providerUserId,
    eventType: `status_${input.nextStatus}`,
    message: input.note || `Status geaendert: ${request.status ?? "pending"} -> ${input.nextStatus}`,
  })

  const recipientId = isProvider ? request.sender_id ?? request.customer_id ?? null : providerLookup.providerUserId
  const notificationType =
    input.nextStatus === "accepted"
      ? "request_accepted"
      : input.nextStatus === "completed"
        ? "request_completed"
        : input.nextStatus === "declined" || input.nextStatus === "rejected"
          ? "request_declined"
          : null

  if (notificationType) {
    await createNotification({
      userId: recipientId,
      actorId: user.id,
      type: notificationType,
      requestId: input.requestId,
      serviceId: request.service_id,
      title:
        input.nextStatus === "accepted"
          ? "Anfrage angenommen"
          : input.nextStatus === "completed"
            ? "Auftrag abgeschlossen"
            : "Anfrage abgelehnt",
      body:
        input.nextStatus === "accepted"
          ? "Der Anbieter hat deine Anfrage angenommen."
          : input.nextStatus === "completed"
            ? "Der Auftrag wurde als abgeschlossen markiert."
            : "Der Anbieter hat deine Anfrage abgelehnt.",
    })
  }

  if (input.nextStatus === "completed") {
    await createNotification({
      userId: request.sender_id ?? request.customer_id,
      actorId: user.id,
      type: "review_available",
      requestId: input.requestId,
      serviceId: request.service_id,
      title: "Bewertung moeglich",
      body: "Du kannst den abgeschlossenen Auftrag jetzt bewerten.",
    })
  }

  return { ok: true as const, data: update.data }
}

async function insertSystemMessage(
  supabase: SupabasePublicClient,
  input: { requestId: string; senderId: string; receiverId: string | null; eventType: string; message: string }
) {
  let insert = await supabase
    .from("chat_messages")
    .insert([
      {
        request_id: input.requestId,
        sender_id: input.senderId,
        receiver_id: input.receiverId,
        message: input.message,
        body: input.message,
        system_event_type: input.eventType,
      },
    ])

  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase.from("chat_messages").insert([
      {
        request_id: input.requestId,
        sender_id: input.senderId,
        message: input.message,
      },
    ])
  }

  return insert
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
