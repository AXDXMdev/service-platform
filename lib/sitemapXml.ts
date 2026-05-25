import { serviceCategories } from "@/app/serviceCatalog"
import { getBaseUrl, seoCities } from "@/lib/seo"

type SitemapEntry = {
  path: string
  changeFrequency: "daily" | "weekly" | "monthly"
  priority: string
}

const staticRoutes: SitemapEntry[] = [
  { path: "/", changeFrequency: "daily", priority: "1.0" },
  { path: "/services", changeFrequency: "weekly", priority: "0.8" },
  { path: "/provider-verification", changeFrequency: "weekly", priority: "0.7" },
  { path: "/waitlist", changeFrequency: "weekly", priority: "0.7" },
  { path: "/apps", changeFrequency: "weekly", priority: "0.6" },
  { path: "/links", changeFrequency: "weekly", priority: "0.6" },
  { path: "/impressum", changeFrequency: "monthly", priority: "0.4" },
  { path: "/datenschutz", changeFrequency: "monthly", priority: "0.4" },
  { path: "/agb", changeFrequency: "monthly", priority: "0.4" },
  { path: "/cookie-einstellungen", changeFrequency: "monthly", priority: "0.3" },
  { path: "/plattform-beschwerden", changeFrequency: "monthly", priority: "0.4" },
  { path: "/report", changeFrequency: "monthly", priority: "0.4" },
]

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export function getSitemapEntries(): SitemapEntry[] {
  const localSeoRoutes = seoCities.flatMap((city) =>
    serviceCategories.map((category) => ({
      path: `/${city}/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: "0.7",
    }))
  )

  return [...staticRoutes, ...localSeoRoutes]
}

export function buildSitemapXml(lastModified = new Date()) {
  const baseUrl = getBaseUrl()
  const lastmod = lastModified.toISOString()
  const urls = getSitemapEntries()
    .map((entry) => {
      const loc = new URL(entry.path, baseUrl).toString()

      return [
        "<url>",
        `<loc>${escapeXml(loc)}</loc>`,
        `<lastmod>${lastmod}</lastmod>`,
        `<changefreq>${entry.changeFrequency}</changefreq>`,
        `<priority>${entry.priority}</priority>`,
        "</url>",
      ].join("")
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`
}
