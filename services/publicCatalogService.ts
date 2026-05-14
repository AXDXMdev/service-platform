import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { Review, Service } from "@/app/types"
import { normalizeText } from "@/lib/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

function mapRatings(rows: Pick<Review, "service_id" | "rating" | "proof_validated">[]) {
  const buckets = new Map<string, number[]>()

  rows
    .filter((item) => item.proof_validated !== false)
    .forEach((item) => {
      const current = buckets.get(item.service_id) ?? []
      current.push(item.rating)
      buckets.set(item.service_id, current)
    })

  return Object.fromEntries(
    Array.from(buckets.entries()).map(([serviceId, values]) => [
      serviceId,
      {
        average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
        count: values.length,
      },
    ])
  ) as Record<string, { average: number; count: number }>
}

async function loadRatings(
  supabase: SupabasePublicClient
) {
  const query = await supabase
    .from("reviews")
    .select("service_id,rating,proof_validated")
    .returns<Pick<Review, "service_id" | "rating" | "proof_validated">[]>()

  if (!query.data) {
    return {}
  }

  return mapRatings(query.data)
}

async function selectFirstAvailable(
  supabase: SupabasePublicClient,
  selects: string[],
  builder: (select: string) => Promise<{ data: Service[] | null; error: { message: string } | null }>
) {
  let lastError: string | null = null

  for (const select of selects) {
    const result = await builder(select)
    if (result.data) {
      return { data: result.data, error: null as string | null }
    }
    lastError = result.error?.message ?? lastError
    if (!result.error || !/column|schema|relation/i.test(result.error.message)) {
      break
    }
  }

  return { data: null, error: lastError }
}

export async function loadHomeFeaturedData(supabase: SupabasePublicClient) {
  const serviceResult = await selectFirstAvailable(
    supabase,
    [
      "id,title,description,created_at,provider_name,user_id,city,district,is_verified,is_volunteer,price_from_eur,media_urls",
      "id,title,description,created_at,provider_name,user_id,city,district,is_verified,is_volunteer,media_urls",
      "id,title,description,created_at,provider_name,user_id,city,district,is_verified,is_volunteer",
      "id,title,description,created_at,provider_name,user_id,city,district,is_verified",
    ],
    async (select) =>
      supabase
        .from("services")
        .select(select)
        .order("created_at", { ascending: false })
        .limit(6)
        .returns<Service[]>()
  )

  const featuredServices = serviceResult.data

  if (!featuredServices) {
    return { ok: false as const, status: 500, message: "Startseiten-Services konnten nicht geladen werden." }
  }

  const ratingsByService = await loadRatings(supabase)

  return {
    ok: true as const,
    data: {
      featuredServices,
      ratingsByService,
    },
  }
}

export async function loadServicesCatalogData(supabase: SupabasePublicClient) {
  const serviceResult = await selectFirstAvailable(
    supabase,
    [
      "id,title,description,created_at,provider_name,user_id,city,district,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,media_urls,is_premium,boost_until,price_from_eur",
      "id,title,description,created_at,provider_name,user_id,city,district,years_experience,service_radius_km,approx_lat,approx_lng,supports_sign_language,text_chat_only,barrier_free_support,is_volunteer,is_verified,is_premium,boost_until,price_from_eur",
      "id,title,description,created_at,provider_name,user_id,city,district,years_experience,service_radius_km,approx_lat,approx_lng,is_verified,media_urls,is_premium,boost_until",
      "id,title,description,created_at,provider_name,user_id,city,district,years_experience,service_radius_km,approx_lat,approx_lng,is_verified,is_premium,boost_until",
      "id,title,description,created_at,provider_name,user_id,city,district,is_verified",
    ],
    async (select) =>
      supabase
        .from("services")
        .select(select)
        .returns<Service[]>()
  )

  const services = serviceResult.data

  if (!services) {
    return { ok: false as const, status: 500, message: "Services konnten nicht geladen werden." }
  }

  const ratingsByService = await loadRatings(supabase)

  return {
    ok: true as const,
    data: {
      services,
      ratingsByService,
    },
  }
}

export async function loadProviderProfileData(
  supabase: SupabasePublicClient,
  providerId: string
) {
  const normalizedProviderId = normalizeText(providerId, 80)
  if (!normalizedProviderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedProviderId)) {
    return { ok: false as const, status: 400, message: "Anbieter-ID ist ungueltig." }
  }

  const query = await selectFirstAvailable(
    supabase,
    [
      "id,title,description,provider_name,user_id,media_urls",
      "id,title,description,provider_name,user_id",
    ],
    async (select) =>
      supabase
        .from("services")
        .select(select)
        .eq("user_id", normalizedProviderId)
        .returns<Service[]>()
  )

  if (!query.data) {
    return { ok: false as const, status: 500, message: "Anbieterprofil konnte nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      services: query.data,
    },
  }
}
