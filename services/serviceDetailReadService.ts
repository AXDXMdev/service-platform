import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { Review, Service } from "@/app/types"
import { normalizeText } from "@/lib/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

async function selectServiceById(
  supabase: SupabasePublicClient,
  serviceId: string,
  selects: string[]
) {
  let lastError: string | null = null

  for (const select of selects) {
    const result = await supabase
      .from("services")
      .select(select)
      .eq("id", serviceId)
      .limit(1)
      .returns<Service[]>()

    if (result.data?.[0]) {
      return { service: result.data[0], error: null as string | null }
    }

    lastError = result.error?.message ?? lastError
    if (result.error && !/column|schema|relation|not found/i.test(result.error.message)) {
      break
    }
  }

  return { service: null as Service | null, error: lastError }
}

export async function loadServiceDetailData(
  supabase: SupabasePublicClient,
  serviceId: string,
  user: User | null
) {
  const id = normalizeText(serviceId, 80)
  if (!id) {
    return { ok: false as const, status: 400, message: "Service fehlt." }
  }

  const serviceResult = await selectServiceById(supabase, id, [
    "id,title,description,provider_name,user_id,city,district,price_from_eur,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,email_verified,phone_verified,identity_verified,business_verified,is_top_rated,provider_avatar_url,provider_last_active_at,response_time_minutes,response_rate_percent,completed_jobs_count,repeat_customer_rate_percent,media_urls,availability_days,availability_note,is_premium,boost_until",
    "id,title,description,provider_name,user_id,city,district,price_from_eur,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,media_urls,availability_days,availability_note,is_premium,boost_until",
    "id,title,description,provider_name,user_id,city,district,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,is_verified,media_urls,availability_days,availability_note,is_premium,boost_until",
    "id,title,description,provider_name,user_id,city,district,is_verified",
  ])
  const service = serviceResult.service

  if (!service) {
    return { ok: false as const, status: 404, message: "Service nicht gefunden." }
  }

  let isFavorite = false
  if (user) {
    const favoriteQuery = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("service_id", id)
      .limit(1)

    if (favoriteQuery.data && favoriteQuery.data.length > 0) {
      isFavorite = true
    }
  }

  const validatedResult = await supabase
    .from("reviews")
    .select("id,rating")
    .eq("service_id", id)
    .eq("proof_validated", true)
    .returns<Pick<Review, "id" | "rating">[]>()

  let ratings = validatedResult.data
  if (
    !ratings &&
    validatedResult.error &&
    /proof_validated|column|schema|relation/i.test(validatedResult.error.message)
  ) {
    const fallback = await supabase
      .from("reviews")
      .select("id,rating")
      .eq("service_id", id)
      .returns<Pick<Review, "id" | "rating">[]>()
    ratings = fallback.data ?? null
  }

  const ratingCount = ratings?.length ?? 0
  const ratingAverage =
    ratingCount > 0
      ? Number(((ratings ?? []).reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(1))
      : null

  return {
    ok: true as const,
    data: {
      currentUserId: user?.id ?? null,
      service,
      isFavorite,
      ratingCount,
      ratingAverage,
    },
  }
}
