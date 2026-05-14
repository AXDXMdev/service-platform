import type { HomepageSection, PageContent, SiteSettings, ThemeSettings, CmsCategory } from "@/lib/siteSettings"
import type {
  AuditEventRow,
  PendingReviewRow,
  ProviderRow,
  ProviderVerificationRequestRow,
  Role,
  ServiceAdminRow,
  WaitlistRow,
} from "@/app/admin/adminShared"
import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type SiteContentEntry = {
  key: string
  content: Record<string, unknown>
}

type AdminOverviewDependencies = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "Unbekannter Fehler."
  return "message" in error && typeof error.message === "string" ? error.message : "Unbekannter Fehler."
}

function isMissingTableMessage(message: string) {
  return /relation .* does not exist|schema|table|column/i.test(message)
}

export async function loadAdminOverview(
  supabase: AdminOverviewDependencies,
  userId: string
) {
  const profile = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle()
  if (profile.error) {
    return { ok: false as const, status: 500, message: "Rollencheck fehlgeschlagen." }
  }

  const role = ((profile.data as { role?: Role | null } | null)?.role ?? null) as Role | null
  if (!role || !["admin", "moderator"].includes(role)) {
    return { ok: false as const, status: 403, message: "Kein Admin-/Moderator-Profil. Zugriff verweigert." }
  }

  const [
    siteQuery,
    themeQuery,
    sectionsQuery,
    categoriesQuery,
    servicesQuery,
    providersQuery,
    waitlistQuery,
    contentQuery,
    pageContentQuery,
    providerVerQuery,
    pendingReviewsQuery,
    auditQuery,
  ] = await Promise.all([
    supabase.from("site_settings").select("*").eq("key", "default").maybeSingle(),
    supabase.from("theme_settings").select("*").eq("key", "default").maybeSingle(),
    supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true }).limit(100),
    supabase.from("cms_categories").select("*").order("sort_order", { ascending: true }).limit(100),
    supabase
      .from("services")
      .select(
        "id,title,description,city,provider_name,user_id,price_from_eur,is_verified,is_active,is_featured"
      )
      .order("id", { ascending: false })
      .limit(60),
    supabase
      .from("profiles")
      .select("user_id,role,full_name,city,contact_email,verification_level,is_visible")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("waitlist_entries")
      .select("id,full_name,email,city,role,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("site_content").select("key,content").order("key", { ascending: true }).limit(100),
    supabase.from("page_contents").select("*").order("slug", { ascending: true }).limit(100),
    supabase
      .from("provider_verification_requests")
      .select("id,user_id,company_name,contact_email,city,website,proof_urls,status,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reviews")
      .select("id,rating,comment,proof_image_urls,reviewer_id,service_id,proof_validated")
      .eq("proof_validated", false)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("request_events")
      .select("id,request_id,event_type,from_status,to_status,actor_id,note,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ])

  const warnings: string[] = []
  const tolerated = [siteQuery, themeQuery, sectionsQuery, categoriesQuery, contentQuery, pageContentQuery]
  for (const result of tolerated) {
    if (result.error && isMissingTableMessage(getErrorMessage(result.error))) {
      warnings.push(getErrorMessage(result.error))
    }
  }

  const hardFailures = [
    servicesQuery,
    providersQuery,
    waitlistQuery,
    providerVerQuery,
    pendingReviewsQuery,
    auditQuery,
  ]
  for (const result of hardFailures) {
    if (result.error && !isMissingTableMessage(getErrorMessage(result.error))) {
      return { ok: false as const, status: 500, message: "Admin-Daten konnten nicht geladen werden." }
    }
  }

  let pendingReviews: PendingReviewRow[] = []
  const reviewRows = (pendingReviewsQuery.data ?? []) as Array<{
    id: string
    rating: number
    comment: string | null
    proof_image_urls: string[] | null
    reviewer_id: string
    service_id: string
  }>

  if (reviewRows.length > 0) {
    const serviceIds = [...new Set(reviewRows.map((item) => item.service_id))]
    const serviceTitlesQuery = await supabase
      .from("services")
      .select("id,title")
      .in("id", serviceIds)
      .returns<Array<{ id: string; title: string }>>()

    const serviceTitles = serviceTitlesQuery.data ?? []
    const serviceById = new Map(serviceTitles.map((item) => [item.id, item.title]))
    pendingReviews = reviewRows.map((review) => ({
      ...review,
      service_title: serviceById.get(review.service_id) ?? null,
    }))
  }

  let auditEvents: AuditEventRow[] = []
  const rawEvents = (auditQuery.data ?? []) as AuditEventRow[]
  if (rawEvents.length > 0) {
    const requestIds = [...new Set(rawEvents.map((event) => event.request_id))]
    const requestsQuery = await supabase
      .from("requests")
      .select("id,service_id,sender_email")
      .in("id", requestIds)
      .returns<Array<{ id: string; service_id: string | null; sender_email: string | null }>>()

    const requests = requestsQuery.data ?? []
    const serviceIds = [
      ...new Set(
        requests.map((request) => request.service_id).filter((value): value is string => Boolean(value))
      ),
    ]

    const servicesForAuditQuery =
      serviceIds.length > 0
        ? await supabase
            .from("services")
            .select("id,title")
            .in("id", serviceIds)
            .returns<Array<{ id: string; title: string }>>()
        : { data: [] as Array<{ id: string; title: string }> }

    const servicesForAudit = servicesForAuditQuery.data ?? []
    const serviceTitleById = new Map(servicesForAudit.map((item) => [item.id, item.title]))
    const requestById = new Map(requests.map((item) => [item.id, item]))

    auditEvents = rawEvents.map((event) => {
      const request = requestById.get(event.request_id)
      const serviceTitle = request?.service_id ? serviceTitleById.get(request.service_id) ?? null : null
      return {
        ...event,
        service_title: serviceTitle,
        sender_email: request?.sender_email ?? null,
      }
    })
  }

  return {
    ok: true as const,
    data: {
      role,
      actorUserId: userId,
      siteSettings: (siteQuery.data ?? null) as SiteSettings | null,
      themeSettings: (themeQuery.data ?? null) as ThemeSettings | null,
      homepageSections: (sectionsQuery.data ?? []) as HomepageSection[],
      categories: (categoriesQuery.data ?? []) as CmsCategory[],
      services: (servicesQuery.data ?? []) as ServiceAdminRow[],
      providers: (providersQuery.data ?? []) as ProviderRow[],
      waitlist: (waitlistQuery.data ?? []) as WaitlistRow[],
      siteContentEntries: (contentQuery.data ?? []) as SiteContentEntry[],
      pageContents: (pageContentQuery.data ?? []) as PageContent[],
      providerVerificationRequests: (providerVerQuery.data ?? []) as ProviderVerificationRequestRow[],
      pendingReviews,
      auditEvents,
      warnings,
    },
  }
}
