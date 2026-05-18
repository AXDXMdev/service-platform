import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type SupabaseAdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

type AggregationWarning = string

type ServiceRow = {
  id: string
  user_id: string | null
  created_at?: string | null
  is_verified?: boolean | null
}

type RequestRow = {
  id: string
  service_id: string | null
  sender_id: string | null
  status: string | null
  created_at?: string | null
  updated_at?: string | null
  finalized_at?: string | null
  completed_at?: string | null
  first_provider_response_at?: string | null
}

type ChatRow = {
  request_id: string
  sender_id: string | null
  created_at: string
}

type ReviewRow = {
  id: string
  request_id: string
  service_id: string
  rating: number
  proof_validated?: boolean | null
}

type VerificationRow = {
  user_id: string
  status: string | null
}

type AbuseReportRow = {
  target_entity_id: string | null
  status: string | null
}

type FavoriteRow = {
  service_id: string
}

type PublicMetricResult<T> = {
  rows: T[]
  available: boolean
}

export type TrustMetricsAggregationResult = {
  ok: true
  processedProviders: number
  processedServices: number
  skipped: number
  warnings: AggregationWarning[]
}

function isMissingSchemaError(message?: string | null) {
  return Boolean(message && /column|schema|relation|does not exist|not found/i.test(message))
}

function roundPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 100)
}

function average(values: number[]) {
  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

function minutesBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  return Math.round((endMs - startMs) / 60_000)
}

async function selectFirstAvailable<T>(
  supabase: SupabaseAdminClient,
  table: string,
  selects: string[],
  warnings: AggregationWarning[],
  label: string
): Promise<PublicMetricResult<T>> {
  let lastError: string | null = null

  for (const select of selects) {
    const query = await supabase.from(table).select(select).returns<T[]>()
    if (query.data) {
      return { rows: query.data, available: true }
    }

    lastError = query.error?.message ?? lastError
    if (!isMissingSchemaError(query.error?.message)) {
      warnings.push(`${label} konnte nicht gelesen werden.`)
      return { rows: [], available: false }
    }
  }

  warnings.push(`${label} nicht verfuegbar${lastError ? `: ${lastError}` : "."}`)
  return { rows: [], available: false }
}

function groupBy<T>(rows: T[], keyFn: (row: T) => string | null | undefined) {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const key = keyFn(row)
    if (!key) continue
    const current = map.get(key) ?? []
    current.push(row)
    map.set(key, current)
  }
  return map
}

function getFirstProviderResponseMinutes(
  request: RequestRow,
  providerId: string,
  chatByRequest: Map<string, ChatRow[]>
) {
  if (request.first_provider_response_at) {
    return minutesBetween(request.created_at, request.first_provider_response_at)
  }

  const messages = [...(chatByRequest.get(request.id) ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const firstProviderMessage = messages.find((message) => message.sender_id === providerId)
  return minutesBetween(request.created_at, firstProviderMessage?.created_at)
}

function calculateTrustScore(input: {
  verified: boolean
  verificationApproved: boolean
  responseRatePercent: number | null
  completedJobsCount: number
  averageRating: number | null
  reviewCount: number
  repeatCustomerRatePercent: number | null
  accountAgeDays: number | null
  openAbuseFlags: number
}) {
  const enoughData =
    input.completedJobsCount >= 3 ||
    input.reviewCount >= 3 ||
    input.responseRatePercent != null

  if (!enoughData) {
    return {
      trustScore: null,
      trustScoreAvailable: false,
      basis: {
        reason: "not_enough_data",
        completedJobsCount: input.completedJobsCount,
        reviewCount: input.reviewCount,
      },
    }
  }

  let score = 35
  if (input.verified) score += 10
  if (input.verificationApproved) score += 10
  if (input.responseRatePercent != null) score += Math.min(20, Math.round(input.responseRatePercent / 5))
  if (input.completedJobsCount > 0) score += Math.min(15, input.completedJobsCount * 2)
  if (input.averageRating != null) score += Math.round(Math.max(0, input.averageRating - 3) * 8)
  if (input.repeatCustomerRatePercent != null) score += Math.min(10, Math.round(input.repeatCustomerRatePercent / 10))
  if (input.accountAgeDays != null && input.accountAgeDays >= 30) score += Math.min(5, Math.floor(input.accountAgeDays / 30))
  score -= Math.min(30, input.openAbuseFlags * 10)

  return {
    trustScore: Math.max(0, Math.min(100, score)),
    trustScoreAvailable: true,
    basis: {
      verified: input.verified,
      verificationApproved: input.verificationApproved,
      responseRatePercent: input.responseRatePercent,
      completedJobsCount: input.completedJobsCount,
      averageRating: input.averageRating,
      reviewCount: input.reviewCount,
      repeatCustomerRatePercent: input.repeatCustomerRatePercent,
      accountAgeDays: input.accountAgeDays,
      openAbuseFlags: input.openAbuseFlags,
    },
  }
}

function daysSince(date?: string | null) {
  if (!date) return null
  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

export async function aggregateTrustMetrics(
  supabase: SupabaseAdminClient
): Promise<TrustMetricsAggregationResult> {
  const warnings: AggregationWarning[] = []

  const servicesResult = await selectFirstAvailable<ServiceRow>(
    supabase,
    "services",
    ["id,user_id,created_at,is_verified", "id,user_id,created_at", "id,user_id"],
    warnings,
    "Services"
  )

  if (!servicesResult.available) {
    return { ok: true, processedProviders: 0, processedServices: 0, skipped: 1, warnings }
  }

  const requestsResult = await selectFirstAvailable<RequestRow>(
    supabase,
    "requests",
    [
      "id,service_id,sender_id,status,created_at,updated_at,finalized_at,completed_at,first_provider_response_at",
      "id,service_id,sender_id,status,created_at,updated_at,finalized_at,first_provider_response_at",
      "id,service_id,sender_id,status,created_at,updated_at",
      "id,service_id,sender_id,status,created_at",
      "id,service_id,sender_id,status",
    ],
    warnings,
    "Requests"
  )

  const chatResult = await selectFirstAvailable<ChatRow>(
    supabase,
    "chat_messages",
    ["request_id,sender_id,created_at"],
    warnings,
    "Chat-Nachrichten"
  )

  const reviewsResult = await selectFirstAvailable<ReviewRow>(
    supabase,
    "reviews",
    ["id,request_id,service_id,rating,proof_validated", "id,request_id,service_id,rating"],
    warnings,
    "Reviews"
  )

  const verificationResult = await selectFirstAvailable<VerificationRow>(
    supabase,
    "provider_verification_requests",
    ["user_id,status"],
    warnings,
    "Provider-Verifizierungen"
  )

  const abuseResult = await selectFirstAvailable<AbuseReportRow>(
    supabase,
    "abuse_reports",
    ["target_entity_id,status"],
    warnings,
    "Abuse Reports"
  )

  const favoritesResult = await selectFirstAvailable<FavoriteRow>(
    supabase,
    "favorites",
    ["service_id"],
    warnings,
    "Favoriten"
  )

  const services = servicesResult.rows
  const requests = requestsResult.rows
  const requestById = new Map(requests.map((request) => [request.id, request]))
  const chatByRequest = groupBy(chatResult.rows, (row) => row.request_id)
  const canMeasureResponses = requestsResult.available && chatResult.available
  const requestsByService = groupBy(requests, (row) => row.service_id)
  const servicesByProvider = groupBy(services, (row) => row.user_id)
  const validatedReviews = reviewsResult.rows.filter((review) => {
    const request = requestById.get(review.request_id)
    return review.proof_validated !== false && request?.status === "completed"
  })

  if (reviewsResult.available && !requestsResult.available) {
    warnings.push("Reviews wurden nicht in Trust-Metriken gezaehlt, weil abgeschlossene Requests nicht pruefbar sind.")
  }

  const reviewsByService = groupBy(validatedReviews, (row) => row.service_id)
  const favoritesByService = groupBy(favoritesResult.rows, (row) => row.service_id)

  const approvedVerificationProviders = new Set(
    verificationResult.rows.filter((row) => row.status === "approved").map((row) => row.user_id)
  )
  const openAbuseByTarget = groupBy(
    abuseResult.rows.filter((row) => row.status === "open" || row.status === "reviewing"),
    (row) => row.target_entity_id
  )

  let processedServices = 0
  let skipped = 0
  const now = new Date().toISOString()

  for (const service of services) {
    const serviceRequests = requestsByService.get(service.id) ?? []
    const answeredRequests = canMeasureResponses
      ? serviceRequests.filter((request) =>
          (chatByRequest.get(request.id) ?? []).some((message) => message.sender_id === service.user_id)
        )
      : []
    const completedRequests = serviceRequests.filter((request) => request.status === "completed")
    const validatedReviews = reviewsByService.get(service.id) ?? []
    const ratingAverage = average(validatedReviews.map((review) => review.rating))

    const upsert = await supabase.from("service_engagement_metrics").upsert({
      service_id: service.id,
      views_24h: 0,
      views_7d: 0,
      inquiries_7d: serviceRequests.filter((request) => {
        const createdAt = request.created_at ? new Date(request.created_at).getTime() : 0
        return createdAt > Date.now() - 7 * 86_400_000
      }).length,
      requests_count: serviceRequests.length,
      answered_requests_count: answeredRequests.length,
      completed_requests_count: completedRequests.length,
      average_rating: ratingAverage,
      review_count: validatedReviews.length,
      favorites_count: favoritesByService.get(service.id)?.length ?? 0,
      last_inquiry_at:
        serviceRequests
          .map((request) => request.created_at)
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      updated_at: now,
    })

    if (upsert.error) {
      if (isMissingSchemaError(upsert.error.message)) {
        skipped += 1
        warnings.push("service_engagement_metrics ist nicht migriert; Service-Metriken wurden uebersprungen.")
        break
      }
      warnings.push(`Service-Metriken konnten fuer ${service.id} nicht gespeichert werden.`)
      skipped += 1
      continue
    }

    processedServices += 1
  }

  let processedProviders = 0

  for (const [providerId, providerServices] of servicesByProvider.entries()) {
    const providerRequests = providerServices.flatMap((service) => requestsByService.get(service.id) ?? [])
    const completedRequests = providerRequests.filter((request) => request.status === "completed")
    const answeredRequests = canMeasureResponses
      ? providerRequests.filter((request) =>
          (chatByRequest.get(request.id) ?? []).some((message) => message.sender_id === providerId)
        )
      : []
    const responseMinutes = canMeasureResponses
      ? providerRequests
          .map((request) => getFirstProviderResponseMinutes(request, providerId, chatByRequest))
          .filter((value): value is number => value != null)
      : []
    const providerReviews = providerServices.flatMap((service) => reviewsByService.get(service.id) ?? [])
    const uniqueCustomers = new Set(providerRequests.map((request) => request.sender_id).filter(Boolean))
    const repeatCustomers = new Set(
      Array.from(uniqueCustomers).filter((customerId) =>
        providerRequests.filter((request) => request.sender_id === customerId && request.status === "completed").length > 1
      )
    )
    const responseRatePercent = canMeasureResponses ? roundPercent(answeredRequests.length, providerRequests.length) : null
    const repeatCustomerRatePercent = roundPercent(repeatCustomers.size, uniqueCustomers.size)
    const averageRating = average(providerReviews.map((review) => review.rating))
    const accountAgeDays =
      providerServices
        .map((service) => daysSince(service.created_at))
        .filter((value): value is number => value != null)
        .sort((a, b) => b - a)
        .at(0) ?? null
    const openAbuseFlags =
      (openAbuseByTarget.get(providerId)?.length ?? 0) +
      providerServices.reduce((sum, service) => sum + (openAbuseByTarget.get(service.id)?.length ?? 0), 0)
    const verificationApproved = approvedVerificationProviders.has(providerId)
    const verified = providerServices.some((service) => service.is_verified) || verificationApproved
    const trust = calculateTrustScore({
      verified,
      verificationApproved,
      responseRatePercent,
      completedJobsCount: completedRequests.length,
      averageRating,
      reviewCount: providerReviews.length,
      repeatCustomerRatePercent,
      accountAgeDays,
      openAbuseFlags,
    })

    const providerPayload = {
      provider_id: providerId,
      email_verified: false,
      phone_verified: false,
      identity_verified: verificationApproved,
      business_verified: verificationApproved,
      is_top_rated: trust.trustScoreAvailable && (trust.trustScore ?? 0) >= 80,
      last_active_at:
        providerRequests
          .flatMap((request) => [request.updated_at, request.created_at])
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      response_time_minutes: responseMinutes.length ? Math.round(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length) : null,
      response_rate_percent: responseRatePercent,
      completed_jobs_count: completedRequests.length,
      repeat_customer_rate_percent: repeatCustomerRatePercent,
      trust_score: trust.trustScore,
      trust_score_available: trust.trustScoreAvailable,
      trust_score_basis: trust.basis,
      updated_at: now,
    }

    const upsert = await supabase.from("provider_trust_profiles").upsert(providerPayload)
    if (upsert.error) {
      if (isMissingSchemaError(upsert.error.message)) {
        skipped += 1
        warnings.push("provider_trust_profiles ist nicht migriert; Provider-Metriken wurden uebersprungen.")
        break
      }
      warnings.push(`Provider-Metriken konnten fuer ${providerId} nicht gespeichert werden.`)
      skipped += 1
      continue
    }

    const serviceIds = providerServices.map((service) => service.id)
    if (serviceIds.length > 0) {
      const denormalizedUpdate = await supabase
        .from("services")
        .update({
          identity_verified: providerPayload.identity_verified,
          business_verified: providerPayload.business_verified,
          is_top_rated: providerPayload.is_top_rated,
          provider_last_active_at: providerPayload.last_active_at,
          response_time_minutes: providerPayload.response_time_minutes,
          response_rate_percent: providerPayload.response_rate_percent,
          completed_jobs_count: providerPayload.completed_jobs_count,
          repeat_customer_rate_percent: providerPayload.repeat_customer_rate_percent,
        })
        .in("id", serviceIds)

      if (denormalizedUpdate.error && isMissingSchemaError(denormalizedUpdate.error.message)) {
        warnings.push("Services-Trust-Spalten fehlen; Denormalisierung wurde uebersprungen.")
      }
    }

    processedProviders += 1
  }

  return { ok: true, processedProviders, processedServices, skipped, warnings: [...new Set(warnings)] }
}
