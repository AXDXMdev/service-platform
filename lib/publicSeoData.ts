import { cache } from "react"
import { createServerSupabasePublicClient, getSupabasePublicEnv } from "@/lib/serverSupabase"
import { loadProviderProfileData } from "@/services/publicCatalogService"
import { loadServiceDetailData } from "@/services/serviceDetailReadService"

function createSeoSupabaseClient() {
  if (!getSupabasePublicEnv()) return null
  return createServerSupabasePublicClient()
}

export const getPublicServiceSeoData = cache(async (serviceId: string) => {
  const supabase = createSeoSupabaseClient()
  if (!supabase) return null

  const result = await loadServiceDetailData(supabase, serviceId, null)
  if (!result.ok) return null
  return result.data
})

export const getPublicProviderSeoData = cache(async (providerId: string) => {
  const supabase = createSeoSupabaseClient()
  if (!supabase) return null

  const result = await loadProviderProfileData(supabase, providerId)
  if (!result.ok) return null
  return result.data
})
