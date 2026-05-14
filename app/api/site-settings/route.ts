import { apiOk } from "@/lib/apiResponse"
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

function isMissingRelation(message?: string) {
  return Boolean(message && /relation .* does not exist|schema|table|column/i.test(message))
}

export async function GET() {
  const supabase = createServerSupabasePublicClient()

  if (!supabase) {
    return apiOk(
      {
        theme: defaultThemeSettings,
        site: defaultSiteSettings,
        sections: [] as HomepageSection[],
        content: {},
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    )
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

  const site = {
    ...defaultSiteSettings,
    ...(siteQuery?.data ?? {}),
    trust_badges: siteQuery?.data?.trust_badges ?? defaultSiteSettings.trust_badges,
    pilot_cities: siteQuery?.data?.pilot_cities ?? defaultSiteSettings.pilot_cities,
    notice_boxes: siteQuery?.data?.notice_boxes ?? defaultSiteSettings.notice_boxes,
  } as SiteSettings

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
      {
        ...fallbackBySlug.get(page.slug),
        ...page,
      },
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

  return apiOk(
    {
      theme,
      site,
      sections: (sectionsQuery?.data ?? []) as HomepageSection[],
      content: {
        ...baseContent,
        ...pageContent,
      },
    },
    {
      warnings,
      headers: {
        "Cache-Control": "public, max-age=20, stale-while-revalidate=120",
      },
    }
  )
}
