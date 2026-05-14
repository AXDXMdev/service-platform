import { normalizeText, toValidHttpUrls } from "@/lib/validation"
import type {
  CmsCategory,
  HomepageSection,
  PageContent,
  SiteSettings,
  ThemeSettings,
} from "@/lib/siteSettings"
import type { NewCategoryDraft } from "@/app/admin/modules/AdminCategoriesModule"
import { adminSaveError } from "@/app/admin/adminShared"
import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type SupabaseAdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

export type AdminCmsAction =
  | {
      action: "saveDesign"
      payload: { themeSettings: ThemeSettings; defaultThemeMode: SiteSettings["default_theme_mode"] }
    }
  | {
      action: "saveHomepage"
      payload: { siteSettings: SiteSettings; homepageSections: HomepageSection[] }
    }
  | {
      action: "savePageContents"
      payload: { pageContents: PageContent[] }
    }
  | {
      action: "createCategory"
      payload: { category: NewCategoryDraft; sortOrder: number }
    }
  | {
      action: "updateCategory"
      payload: { category: CmsCategory }
    }
  | {
      action: "saveSiteContent"
      payload: { siteContent: Record<string, Record<string, unknown>> }
    }

function normalizeList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeText(String(item ?? ""), maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function sanitizeThemeSettings(themeSettings: ThemeSettings): ThemeSettings {
  return {
    ...themeSettings,
    text_logo: normalizeText(themeSettings.text_logo ?? "", 40) || null,
    logo_url: themeSettings.logo_url ? toValidHttpUrls(themeSettings.logo_url)[0] ?? null : null,
    hero_background_url: themeSettings.hero_background_url
      ? toValidHttpUrls(themeSettings.hero_background_url)[0] ?? null
      : null,
    card_style: normalizeText(themeSettings.card_style ?? "soft", 40) || "soft",
    border_radius: Math.min(Math.max(Number(themeSettings.border_radius) || 0, 0), 30),
  }
}

function sanitizeSiteSettings(siteSettings: SiteSettings, defaultThemeMode?: SiteSettings["default_theme_mode"]) {
  const resolvedThemeMode = defaultThemeMode ?? siteSettings.default_theme_mode
  return {
    ...siteSettings,
    hero_title: normalizeText(siteSettings.hero_title ?? "", 180) || null,
    hero_subheadline: normalizeText(siteSettings.hero_subheadline ?? "", 280) || null,
    hero_cta_find: normalizeText(siteSettings.hero_cta_find ?? "", 70) || null,
    hero_cta_offer: normalizeText(siteSettings.hero_cta_offer ?? "", 70) || null,
    trust_badges: normalizeList(siteSettings.trust_badges, 20, 200),
    pilot_cities: normalizeList(siteSettings.pilot_cities, 20, 80),
    notice_boxes: normalizeList(siteSettings.notice_boxes, 20, 200),
    default_theme_mode: resolvedThemeMode === "light" ? "light" : "dark",
  }
}

function sanitizeHomepageSections(homepageSections: HomepageSection[]) {
  return homepageSections.map((section, index) => ({
    key: normalizeText(section.key ?? "", 80),
    label: normalizeText(section.label ?? "", 120),
    enabled: Boolean(section.enabled),
    sort_order: Number(section.sort_order ?? index) || index,
  }))
}

function sanitizePageContents(pageContents: PageContent[]) {
  return pageContents.map((page) => ({
    slug: normalizeText(page.slug ?? "", 120),
    title: normalizeText(page.title ?? "", 160),
    subtitle: normalizeText(page.subtitle ?? "", 260) || null,
    content: normalizeText(page.content ?? "", 1600) || null,
    meta_title: normalizeText(page.meta_title ?? "", 160) || null,
    meta_description: normalizeText(page.meta_description ?? "", 260) || null,
    is_active: Boolean(page.is_active),
  }))
}

function sanitizeCategoryInput(category: CmsCategory | NewCategoryDraft) {
  return {
    slug: normalizeText(category.slug?.toLowerCase() ?? "", 50),
    name: normalizeText(category.name ?? "", 80),
    icon: normalizeText(category.icon ?? "", 60),
    description: normalizeText(category.description ?? "", 220),
    color: normalizeText(category.color ?? "", 20) || "#356fe3",
  }
}

function sanitizeSiteContent(siteContent: Record<string, Record<string, unknown>>) {
  const allowedKeys = new Set(["footer", "help", "accessibility"])
  return Object.fromEntries(
    Object.entries(siteContent)
      .filter(([key]) => allowedKeys.has(key))
      .map(([key, value]) => [
        key,
        Object.fromEntries(
          Object.entries(value ?? {}).map(([entryKey, entryValue]) => [
            entryKey,
            normalizeText(String(entryValue ?? ""), 700) || "",
          ])
        ),
      ])
  )
}

async function saveDesign(
  supabase: SupabaseAdminClient,
  payload: { themeSettings: ThemeSettings; defaultThemeMode: SiteSettings["default_theme_mode"] }
) {
  const themePayload = sanitizeThemeSettings(payload.themeSettings)
  const [themeSave, siteSave] = await Promise.all([
    supabase.from("theme_settings").upsert([{ ...themePayload, key: "default" }], { onConflict: "key" }),
    supabase
      .from("site_settings")
      .upsert([{ key: "default", default_theme_mode: payload.defaultThemeMode }], { onConflict: "key" }),
  ])

  if (themeSave.error || siteSave.error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(themeSave.error?.message ?? siteSave.error?.message),
    }
  }

  return { ok: true as const, message: "Design gespeichert." }
}

async function saveHomepage(
  supabase: SupabaseAdminClient,
  payload: { siteSettings: SiteSettings; homepageSections: HomepageSection[] }
) {
  const siteSettings = sanitizeSiteSettings(payload.siteSettings)
  const homepageSections = sanitizeHomepageSections(payload.homepageSections)

  const siteSave = await supabase
    .from("site_settings")
    .upsert([{ ...siteSettings, key: "default" }], { onConflict: "key" })

  const sectionSaves = await Promise.all(
    homepageSections.map((section) =>
      supabase.from("homepage_sections").upsert([section], { onConflict: "key" })
    )
  )

  const sectionError = sectionSaves.find((result) => result.error)?.error
  if (siteSave.error || sectionError) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(siteSave.error?.message ?? sectionError?.message),
    }
  }

  return { ok: true as const, message: "Startseite gespeichert." }
}

async function savePageContents(
  supabase: SupabaseAdminClient,
  payload: { pageContents: PageContent[] }
) {
  const updates = sanitizePageContents(payload.pageContents).map((page) =>
    supabase.from("page_contents").upsert([page], { onConflict: "slug" })
  )
  const results = await Promise.all(updates)
  const error = results.find((result) => result.error)?.error
  if (error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(error.message),
    }
  }

  return { ok: true as const, message: "Page-Inhalte gespeichert." }
}

async function createCategory(
  supabase: SupabaseAdminClient,
  payload: { category: NewCategoryDraft; sortOrder: number }
) {
  const category = sanitizeCategoryInput(payload.category)
  if (!category.slug || !category.name || !category.icon) {
    return {
      ok: false as const,
      status: 400,
      message: "Bitte slug, Name und Icon für neue Kategorie ausfüllen.",
    }
  }

  const insert = await supabase.from("cms_categories").insert([
    {
      ...category,
      sort_order: Math.max(Number(payload.sortOrder) || 10, 1),
      is_active: true,
    },
  ])

  if (insert.error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(insert.error.message),
    }
  }

  return { ok: true as const, message: "Kategorie erstellt." }
}

async function updateCategory(
  supabase: SupabaseAdminClient,
  payload: { category: CmsCategory }
) {
  const category = sanitizeCategoryInput(payload.category)
  const update = await supabase
    .from("cms_categories")
    .update({
      ...category,
      is_active: Boolean(payload.category.is_active),
    })
    .eq("id", payload.category.id)

  if (update.error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(update.error.message),
    }
  }

  return { ok: true as const, message: "Kategorie gespeichert." }
}

async function saveSiteContent(
  supabase: SupabaseAdminClient,
  payload: { siteContent: Record<string, Record<string, unknown>> }
) {
  const contentEntries = Object.entries(sanitizeSiteContent(payload.siteContent))
  const updates = contentEntries.map(([key, content]) =>
    supabase.from("site_content").upsert([{ key, content }], { onConflict: "key" })
  )
  const results = await Promise.all(updates)
  const error = results.find((result) => result.error)?.error

  if (error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(error.message),
    }
  }

  return { ok: true as const, message: "Content gespeichert." }
}

export async function executeAdminCmsAction(
  supabase: SupabaseAdminClient,
  input: AdminCmsAction
) {
  switch (input.action) {
    case "saveDesign":
      return saveDesign(supabase, input.payload)
    case "saveHomepage":
      return saveHomepage(supabase, input.payload)
    case "savePageContents":
      return savePageContents(supabase, input.payload)
    case "createCategory":
      return createCategory(supabase, input.payload)
    case "updateCategory":
      return updateCategory(supabase, input.payload)
    case "saveSiteContent":
      return saveSiteContent(supabase, input.payload)
    default:
      return {
        ok: false as const,
        status: 400,
        message: "Unbekannte CMS-Aktion.",
      }
  }
}
