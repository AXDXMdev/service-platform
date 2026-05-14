import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/impressum", "/datenschutz", "/agb"],
        disallow: ["/admin", "/dashboard", "/my-requests", "/favorites", "/chat"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
