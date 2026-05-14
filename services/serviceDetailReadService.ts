import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { Review, Service } from "@/app/types"
import { normalizeText } from "@/lib/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function loadServiceDetailData(
  supabase: SupabasePublicClient,
  serviceId: string,
  user: User | null
) {
  const id = normalizeText(serviceId, 80)
  if (!id) {
    return { ok: false as const, status: 400, message: "Service fehlt." }
  }

  const richQuery = await supabase
    .from("services")
    .select(
      "id,title,description,provider_name,user_id,city,district,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,media_urls,availability_days,availability_note,is_premium,boost_until"
    )
    .eq("id", id)
    .single()

  let service = richQuery.data as Service | null
  if (!service && richQuery.error) {
    if (
      /column|schema|supports_sign_language|text_chat_only|barrier_free_support|is_volunteer|media_urls/i.test(
        richQuery.error.message
      )
    ) {
      const fallbackQuery = await supabase
        .from("services")
        .select(
          "id,title,description,provider_name,user_id,city,district,provider_bio,years_experience,service_radius_km,approx_lat,approx_lng,is_verified,media_urls,availability_days,availability_note,is_premium,boost_until"
        )
        .eq("id", id)
        .single()
      service = (fallbackQuery.data as Service | null) ?? null
    } else {
      return { ok: false as const, status: 500, message: "Service konnte nicht geladen werden." }
    }
  }

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
