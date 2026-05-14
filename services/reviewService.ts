import type { User } from "@supabase/supabase-js"
import type { Review } from "@/app/types"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function createReview(
  supabase: SupabasePublicClient,
  user: User,
  input: {
    requestId: string
    serviceId: string
    rating: number
    comment: string | null
    proofUrls: string[]
  }
) {
  const requestQuery = await supabase
    .from("requests")
    .select("id,service_id,sender_id,status")
    .eq("id", input.requestId)
    .single()

  if (requestQuery.error || !requestQuery.data) {
    return { ok: false as const, status: 404, message: "Anfrage wurde nicht gefunden." }
  }

  if (requestQuery.data.sender_id !== user.id) {
    return { ok: false as const, status: 403, message: "Du kannst nur eigene Anfragen bewerten." }
  }

  if (requestQuery.data.service_id !== input.serviceId) {
    return { ok: false as const, status: 400, message: "Bewertung passt nicht zur Anfrage." }
  }

  if (!["accepted", "completed"].includes(requestQuery.data.status ?? "")) {
    return { ok: false as const, status: 400, message: "Diese Anfrage ist noch nicht bewertbar." }
  }

  const existing = await supabase
    .from("reviews")
    .select("*")
    .eq("request_id", input.requestId)
    .eq("reviewer_id", user.id)
    .maybeSingle()
    .returns<Review | null>()

  if (existing.data) {
    return { ok: false as const, status: 409, message: "Zu dieser Anfrage existiert bereits eine Bewertung." }
  }

  const serviceQuery = await supabase
    .from("services")
    .select("id,user_id")
    .eq("id", input.serviceId)
    .single()

  if (serviceQuery.error || !serviceQuery.data) {
    return { ok: false as const, status: 404, message: "Service wurde nicht gefunden." }
  }

  const insert = await supabase
    .from("reviews")
    .insert([
      {
        request_id: input.requestId,
        service_id: input.serviceId,
        reviewer_id: user.id,
        reviewee_id: serviceQuery.data.user_id ?? null,
        rating: input.rating,
        comment: input.comment,
        proof_image_urls: input.proofUrls,
        proof_validated: false,
      },
    ])
    .select("*")
    .single()

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Bewertung konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data as Review }
}
