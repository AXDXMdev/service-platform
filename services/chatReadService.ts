import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { ChatMessage } from "@/app/types"
import { normalizeText } from "@/lib/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function loadChatMessages(
  supabase: SupabasePublicClient,
  user: User,
  requestId: string
) {
  const cleanRequestId = normalizeText(requestId, 80)
  if (!cleanRequestId) {
    return { ok: false as const, status: 400, message: "Anfrage fehlt." }
  }

  const requestResult = await supabase
    .from("requests")
    .select("id,sender_id,service_id")
    .eq("id", cleanRequestId)
    .maybeSingle()

  if (requestResult.error || !requestResult.data) {
    return { ok: false as const, status: 404, message: "Anfrage nicht gefunden." }
  }

  const requestRow = requestResult.data as {
    id: string
    sender_id: string | null
    service_id: string | null
  }

  let providerUserId: string | null = null
  if (requestRow.service_id) {
    const serviceResult = await supabase
      .from("services")
      .select("user_id")
      .eq("id", requestRow.service_id)
      .maybeSingle()

    if (!serviceResult.error) {
      providerUserId = ((serviceResult.data as { user_id?: string | null } | null)?.user_id ?? null)
    }
  }

  const isParticipant = user.id === requestRow.sender_id || user.id === providerUserId
  if (!isParticipant) {
    return { ok: false as const, status: 404, message: "Chat nicht gefunden." }
  }

  const messageResult = await supabase
    .from("chat_messages")
    .select("*")
    .eq("request_id", cleanRequestId)
    .order("created_at", { ascending: true })
    .returns<ChatMessage[]>()

  if (messageResult.error) {
    const message =
      /chat_messages|relation|schema|table|column/i.test(messageResult.error.message)
        ? "Chat wird aktiv, sobald die neue DB-Migration ausgefuehrt ist."
        : "Chat-Nachrichten konnten nicht geladen werden."
    return { ok: false as const, status: 500, message }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      requestId: cleanRequestId,
      messages: messageResult.data ?? [],
    },
  }
}
