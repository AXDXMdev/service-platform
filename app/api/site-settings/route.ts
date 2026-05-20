import { apiOk } from "@/lib/apiResponse"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { loadSiteSettingsPayload } from "@/services/siteSettingsReadService"

export async function GET() {
  const supabase = createServerSupabasePublicClient()
  const payload = await loadSiteSettingsPayload(supabase)

  return apiOk(
    {
      theme: payload.theme,
      site: payload.site,
      sections: payload.sections,
      content: payload.content,
    },
    {
      warnings: payload.warnings,
      headers: {
        "Cache-Control": "public, max-age=20, stale-while-revalidate=120",
      },
    }
  )
}
