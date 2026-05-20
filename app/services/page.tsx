import ServicesPageClient from "@/components/ServicesPageClient"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadServicesCatalogData } from "@/services/publicCatalogService"

export const revalidate = 120

export default async function ServicesPage() {
  const supabase = getSupabasePublicEnv() ? createServerSupabasePublicClient() : null

  if (!supabase) {
    return <ServicesPageClient initialServices={[]} initialRatingsByService={{}} initialError="Supabase ist aktuell nicht konfiguriert." initialLoaded />
  }

  const result = await loadServicesCatalogData(supabase)

  if (!result.ok) {
    return <ServicesPageClient initialServices={[]} initialRatingsByService={{}} initialError={result.message} initialLoaded />
  }

  return (
    <ServicesPageClient
      initialServices={result.data.services}
      initialRatingsByService={result.data.ratingsByService}
      initialLoaded
    />
  )
}
