import { buildSitemapXml } from "@/lib/sitemapXml"

export const dynamic = "force-static"
export const revalidate = 3600

export function GET() {
  return new Response(buildSitemapXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
