import { buildSitemapXml } from "@/lib/sitemapXml"

export const dynamic = "force-dynamic"
export const revalidate = 0

export function GET() {
  return new Response(buildSitemapXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
