import type { CmsCategory, HomepageSection, PageContent, SiteSettings, ThemeSettings } from "@/lib/siteSettings"
import type { NewCategoryDraft } from "@/app/admin/modules/AdminCategoriesModule"

type AdminCmsClientAction =
  | { action: "saveDesign"; payload: { themeSettings: ThemeSettings; defaultThemeMode: SiteSettings["default_theme_mode"] } }
  | { action: "saveHomepage"; payload: { siteSettings: SiteSettings; homepageSections: HomepageSection[] } }
  | { action: "savePageContents"; payload: { pageContents: PageContent[] } }
  | { action: "createCategory"; payload: { category: NewCategoryDraft; sortOrder: number } }
  | { action: "updateCategory"; payload: { category: CmsCategory } }
  | { action: "saveSiteContent"; payload: { siteContent: Record<string, Record<string, unknown>> } }

export async function postAdminCmsAction(action: AdminCmsClientAction) {
  const response = await fetch("/api/admin/cms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Admin-CMS Aktion fehlgeschlagen.")
  }

  return payload.data
}
