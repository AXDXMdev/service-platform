import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { Favorite, Service } from "@/app/types"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function loadFavoritesData(
  supabase: SupabasePublicClient,
  user: User
) {
  const favoriteQuery = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Favorite[]>()

  if (favoriteQuery.error) {
    const message =
      /favorites|relation|schema|table|column/i.test(favoriteQuery.error.message)
        ? "Favoriten sind gerade nicht erreichbar. Bitte versuche es später erneut."
        : "Favoriten konnten nicht geladen werden."
    return { ok: false as const, status: 500, message }
  }

  const favorites = favoriteQuery.data ?? []
  const serviceIds = favorites.map((row) => row.service_id)
  const serviceQuery =
    serviceIds.length > 0
      ? await supabase.from("services").select("*").in("id", serviceIds).returns<Service[]>()
      : { data: [] as Service[], error: null }

  if (serviceQuery.error) {
    return { ok: false as const, status: 500, message: "Favoriten-Services konnten nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      favorites,
      services: serviceQuery.data ?? [],
    },
  }
}
