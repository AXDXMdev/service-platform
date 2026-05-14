import type {
  AuditEventRow,
  PendingReviewRow,
  ProviderRow,
  ProviderVerificationRequestRow,
  Role,
  ServiceAdminRow,
  WaitlistRow,
} from "@/app/admin/adminShared"
import type { CmsCategory, HomepageSection, PageContent, SiteSettings, ThemeSettings } from "@/lib/siteSettings"
import { authenticatedFetch } from "@/lib/authenticatedApi"

type SiteContentEntry = {
  key: string
  content: Record<string, unknown>
}

export type AdminOverviewPayload = {
  role: Role
  actorUserId: string
  siteSettings: SiteSettings | null
  themeSettings: ThemeSettings | null
  homepageSections: HomepageSection[]
  categories: CmsCategory[]
  services: ServiceAdminRow[]
  providers: ProviderRow[]
  waitlist: WaitlistRow[]
  siteContentEntries: SiteContentEntry[]
  pageContents: PageContent[]
  providerVerificationRequests: ProviderVerificationRequestRow[]
  pendingReviews: PendingReviewRow[]
  auditEvents: AuditEventRow[]
  warnings: string[]
}

export async function getAdminOverview() {
  const response = await authenticatedFetch("/api/admin/overview")
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Admin-Daten konnten nicht geladen werden.")
  }

  return payload.data as AdminOverviewPayload
}
