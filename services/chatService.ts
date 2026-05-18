import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { isMissingSchemaError } from "@/services/validation"
import { createNotification } from "@/services/notificationService"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function createChatMessage(
  supabase: SupabasePublicClient,
  user: User,
  input: { requestId: string; message: string }
) {
  const requestQuery = await supabase
    .from("requests")
    .select("id,sender_id,customer_id,provider_id,service_id,first_provider_response_at")
    .eq("id", input.requestId)
    .single()

  let requestData: unknown = requestQuery.data
  let requestError = requestQuery.error

  if (requestError && isMissingSchemaError(requestError.message)) {
    const fallback = await supabase
      .from("requests")
      .select("id,sender_id,service_id")
      .eq("id", input.requestId)
      .single()
    requestData = fallback.data
    requestError = fallback.error
  }

  if (requestError || !requestData) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  const request = requestData as {
    sender_id: string | null
    customer_id?: string | null
    provider_id?: string | null
    service_id: string | null
    first_provider_response_at?: string | null
  }

  const serviceQuery = request.service_id
    ? await supabase.from("services").select("id,user_id").eq("id", request.service_id).single()
    : { data: null, error: { message: "service_missing" } }

  if (serviceQuery.error || !serviceQuery.data) {
    return { ok: false as const, status: 404, message: "Service zur Anfrage wurde nicht gefunden." }
  }

  const customerId = request.customer_id ?? request.sender_id
  const providerId = request.provider_id ?? serviceQuery.data.user_id ?? null
  const isCustomer = customerId === user.id || request.sender_id === user.id
  const isProvider = providerId === user.id || serviceQuery.data.user_id === user.id

  if (!isCustomer && !isProvider) {
    return { ok: false as const, status: 403, message: "Keine Berechtigung fuer diesen Chat." }
  }

  const receiverId = isProvider ? customerId : providerId
  const now = new Date().toISOString()

  let insert = await supabase
    .from("chat_messages")
    .insert([
      {
        request_id: input.requestId,
        sender_id: user.id,
        receiver_id: receiverId,
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
          sender_id: user.id,
          message: input.message,
        },
      ])
      .select("*")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Nachricht konnte nicht gesendet werden." }
  }

  if (isProvider && !request.first_provider_response_at) {
    const update = await supabase
      .from("requests")
      .update({ first_provider_response_at: insert.data?.created_at ?? now })
      .eq("id", input.requestId)

    if (update.error && !isMissingSchemaError(update.error.message)) {
      return { ok: false as const, status: 500, message: "Antwort wurde gesendet, aber Antwortzeit konnte nicht gesetzt werden." }
    }
  }

  await createNotification({
    userId: receiverId,
    actorId: user.id,
    type: "new_message",
    requestId: input.requestId,
    serviceId: request.service_id,
    title: "Neue Nachricht",
    body: input.message,
  })

  return { ok: true as const, data: insert.data }
}
