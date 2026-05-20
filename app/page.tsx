import HomePageClient from "@/components/HomePageClient"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadHomeFeaturedData } from "@/services/publicCatalogService"

export const revalidate = 120

export default async function HomePage() {
  const supabase = getSupabasePublicEnv() ? createServerSupabasePublicClient() : null

  if (!supabase) {
    return <HomePageClient initialFeaturedServices={[]} initialRatingsByService={{}} initialLoaded />
  }

  const result = await loadHomeFeaturedData(supabase)

  if (!result.ok) {
    return <HomePageClient initialFeaturedServices={[]} initialRatingsByService={{}} initialLoaded />
  }

  return (
    <HomePageClient
      initialFeaturedServices={result.data.featuredServices}
      initialRatingsByService={result.data.ratingsByService}
      initialLoaded
    />
  )
}
