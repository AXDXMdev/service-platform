import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function createChatMessage(
  supabase: SupabasePublicClient,
  user: User,
  input: { requestId: string; message: string }
) {
  const requestQuery = await supabase
    .from("requests")
    .select("id,sender_id,service_id")
    .eq("id", input.requestId)
    .single()

  if (requestQuery.error || !requestQuery.data) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  const request = requestQuery.data as {
    sender_id: string | null
    service_id: string | null
  }

  const serviceQuery = request.service_id
    ? await supabase.from("services").select("id,user_id").eq("id", request.service_id).single()
    : { data: null, error: { message: "service_missing" } }

  if (serviceQuery.error || !serviceQuery.data) {
    return { ok: false as const, status: 404, message: "Service zur Anfrage wurde nicht gefunden." }
  }

  if (request.sender_id !== user.id && serviceQuery.data.user_id !== user.id) {
    return { ok: false as const, status: 403, message: "Keine Berechtigung fuer diesen Chat." }
  }

  const insert = await supabase
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

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Nachricht konnte nicht gesendet werden." }
  }

  return { ok: true as const, data: insert.data }
}
