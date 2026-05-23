import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/seo"

const baseUrl = getBaseUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/services",
          "/links",
          "/apps",
          "/provider-verification",
          "/waitlist",
          "/report",
          "/plattform-beschwerden",
          "/impressum",
          "/datenschutz",
          "/agb",
          "/cookie-einstellungen",
          "/stuttgart",
        ],
        disallow: ["/admin", "/dashboard", "/my-requests", "/favorites", "/chat"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
