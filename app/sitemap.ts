import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/services",
    "/create-service",
    "/dashboard",
    "/my-requests",
    "/favorites",
    "/provider-verification",
    "/waitlist",
    "/apps",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/login",
    "/register",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
