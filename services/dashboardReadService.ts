import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import type { Review, Service, ServiceRequest } from "@/app/types"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function loadProviderDashboardData(
  supabase: SupabasePublicClient,
  user: User
) {
  const serviceResult = await supabase
    .from("services")
    .select("*")
    .eq("user_id", user.id)
    .returns<Service[]>()

  if (serviceResult.error) {
    return { ok: false as const, status: 500, message: "Services konnten nicht geladen werden." }
  }

  const services = serviceResult.data ?? []
  const serviceIds = services.map((service) => service.id)

  const requestResult =
    serviceIds.length > 0
      ? await supabase
          .from("requests")
          .select("*")
          .in("service_id", serviceIds)
          .neq("status", "deleted")
          .returns<ServiceRequest[]>()
      : { data: [] as ServiceRequest[], error: null }

  if (requestResult.error) {
    return { ok: false as const, status: 500, message: "Anfragen konnten nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      services,
      requests: requestResult.data ?? [],
    },
  }
}

export async function loadCustomerRequestsData(
  supabase: SupabasePublicClient,
  user: User
) {
  const requestResult = await supabase
    .from("requests")
    .select("*")
    .eq("sender_id", user.id)
    .neq("status", "deleted")
    .returns<ServiceRequest[]>()

  if (requestResult.error) {
    return { ok: false as const, status: 500, message: "Anfragen konnten nicht geladen werden." }
  }

  const requests = requestResult.data ?? []
  const serviceIds = [...new Set(requests.map((item) => item.service_id))]
  const serviceResult =
    serviceIds.length > 0
      ? await supabase
          .from("services")
          .select("*")
          .in("id", serviceIds)
          .returns<Service[]>()
      : { data: [] as Service[], error: null }

  if (serviceResult.error) {
    return { ok: false as const, status: 500, message: "Service-Daten konnten nicht geladen werden." }
  }

  const reviewResult = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewer_id", user.id)
    .returns<Review[]>()

  if (reviewResult.error) {
    return { ok: false as const, status: 500, message: "Bewertungen konnten nicht geladen werden." }
  }

  return {
    ok: true as const,
    data: {
      currentUserId: user.id,
      requests,
      services: serviceResult.data ?? [],
      reviews: reviewResult.data ?? [],
    },
  }
}
