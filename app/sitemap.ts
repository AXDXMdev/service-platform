import type { MetadataRoute } from "next"
import { serviceCategories } from "@/app/serviceCatalog"
import { getBaseUrl, seoCities } from "@/lib/seo"

const baseUrl = getBaseUrl()

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/services",
    "/create-service",
    "/provider-verification",
    "/waitlist",
    "/apps",
    "/links",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/cookie-einstellungen",
    "/plattform-beschwerden",
    "/report",
  ]

  const localSeoRoutes = seoCities.flatMap((city) =>
    serviceCategories.map((category) => `/${city}/${category.slug}`)
  )

  return [...routes, ...localSeoRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
