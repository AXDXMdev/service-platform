import { logServerWarn } from "@/lib/serverLogger"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import {
  defaultPageContents,
  defaultSiteSettings,
  defaultThemeSettings,
  type HomepageSection,
  type PageContent,
  type SiteContentRecord,
  type SiteSettings,
  type ThemeSettings,
} from "@/lib/siteSettings"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export type SiteSettingsPayload = {
  theme: ThemeSettings
  site: SiteSettings
  sections: HomepageSection[]
  content: Record<string, Record<string, unknown>>
  warnings: string[]
}

function isMissingRelation(message?: string) {
  return Boolean(message && /relation .* does not exist|schema|table|column/i.test(message))
}

function defaultContentMap() {
  return Object.fromEntries(
    defaultPageContents.map((page) => [
      `page:${page.slug}`,
      { ...page } as Record<string, unknown>,
    ])
  )
}

const publicCopyReplacements: Array<[RegExp, string]> = [
  [
    /Hilfinio - lokale Hilfe, die wirklich weiterhilft\./g,
    "Finde Menschen in deiner Nähe, die dir wirklich helfen.",
  ],
  [
    /Finde geprüfte Anbieter für Alltag, Zuhause und kleine Notfälle\. Schnell, lokal und verständlich\./g,
    "Ob Reinigung, Umzug, Möbelaufbau oder Nachhilfe: Hilfinio bringt dich schnell zu passenden Anbietern in Stuttgart, Esslingen und Umgebung.",
  ],
  [/\bTaskora\b/g, "Hilfinio"],
  [/\bHilfino\b/g, "Hilfinio"],
  [/\bfuer\b/g, "für"],
  [/\bFuer\b/g, "Für"],
  [/\bgepruefte\b/g, "geprüfte"],
  [/\bGepruefte\b/g, "Geprüfte"],
  [/\bNotfaelle\b/g, "Notfälle"],
  [/\bverstaendlich\b/g, "verständlich"],
  [/\bPilotstaedten\b/g, "Pilotstädten"],
  [/\bNaehe\b/g, "Nähe"],
  [/\bUebersicht\b/g, "Übersicht"],
  [/\bkoennen\b/g, "können"],
  [/\bKoennen\b/g, "Können"],
  [/\bstaerkt\b/g, "stärkt"],
  [/\bstaerken\b/g, "stärken"],
  [/\bMuenchen\b/g, "Esslingen"],
]

function sanitizePublicCopy(value: string) {
  return publicCopyReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value
  )
}

function sanitizePublicValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizePublicCopy(value)
  if (Array.isArray(value)) return value.map(sanitizePublicValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizePublicValue(entry)])
    )
  }
  return value
}

function sanitizeSiteSettings(site: SiteSettings): SiteSettings {
  const rawCities = Array.isArray(site.pilot_cities) ? site.pilot_cities : []
  const hasLegacyCities = rawCities.some((city) => /berlin|hamburg|muenchen|münchen/i.test(city))

  return sanitizePublicValue({
    ...site,
    pilot_cities: hasLegacyCities || rawCities.length === 0 ? defaultSiteSettings.pilot_cities : rawCities,
  }) as SiteSettings
}

export async function loadSiteSettingsPayload(
  supabase: SupabasePublicClient | null
): Promise<SiteSettingsPayload> {
  if (!supabase) {
    return {
      theme: defaultThemeSettings,
      site: defaultSiteSettings,
      sections: [],
      content: defaultContentMap(),
      warnings: [],
    }
  }

  const [themeResult, siteResult, sectionsResult, contentResult, pagesResult] =
    await Promise.allSettled([
      supabase.from("theme_settings").select("*").eq("key", "default").maybeSingle(),
      supabase.from("site_settings").select("*").eq("key", "default").maybeSingle(),
      supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true }),
      supabase.from("site_content").select("key,content"),
      supabase.from("page_contents").select("*").eq("is_active", true),
    ])

  const themeQuery = themeResult.status === "fulfilled" ? themeResult.value : null
  const siteQuery = siteResult.status === "fulfilled" ? siteResult.value : null
  const sectionsQuery = sectionsResult.status === "fulfilled" ? sectionsResult.value : null
  const contentQuery = contentResult.status === "fulfilled" ? contentResult.value : null
  const pagesQuery = pagesResult.status === "fulfilled" ? pagesResult.value : null

  const theme = {
    ...defaultThemeSettings,
    ...(themeQuery?.data ?? {}),
  } as ThemeSettings

  const site = sanitizeSiteSettings({
    ...defaultSiteSettings,
    ...(siteQuery?.data ?? {}),
    trust_badges: siteQuery?.data?.trust_badges ?? defaultSiteSettings.trust_badges,
    pilot_cities: siteQuery?.data?.pilot_cities ?? defaultSiteSettings.pilot_cities,
    notice_boxes: siteQuery?.data?.notice_boxes ?? defaultSiteSettings.notice_boxes,
  } as SiteSettings)

  const baseContent =
    contentQuery?.data && !contentQuery.error
      ? Object.fromEntries(
          (contentQuery.data as SiteContentRecord[]).map((entry) => [
            entry.key,
            (entry.content ?? {}) as Record<string, unknown>,
          ])
        )
      : {}

  const dbPageRows =
    pagesQuery?.data && !pagesQuery.error ? (pagesQuery.data as PageContent[]) : []
  const pageRows = dbPageRows.length > 0 ? dbPageRows : defaultPageContents
  const fallbackBySlug = new Map(defaultPageContents.map((page) => [page.slug, page]))
  const pageContent = Object.fromEntries(
    pageRows.map((page) => [
      `page:${page.slug}`,
      sanitizePublicValue({
        ...fallbackBySlug.get(page.slug),
        ...page,
      }) as Record<string, unknown>,
    ])
  )

  const warnings = [
    themeQuery?.error && isMissingRelation(themeQuery.error.message) ? "theme_settings fehlt" : null,
    siteQuery?.error && isMissingRelation(siteQuery.error.message) ? "site_settings fehlt" : null,
    pagesQuery?.error && isMissingRelation(pagesQuery.error.message) ? "page_contents fehlt" : null,
  ].filter((warning): warning is string => Boolean(warning))

  if (warnings.length > 0) {
    logServerWarn("Site settings loaded with fallback warnings", { warnings })
  }

  return {
    theme,
    site,
    sections: (sectionsQuery?.data ?? []) as HomepageSection[],
    content: {
      ...(sanitizePublicValue(baseContent) as Record<string, Record<string, unknown>>),
      ...pageContent,
    },
    warnings,
  }
}
