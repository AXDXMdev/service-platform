import type { Service } from "@/app/types"
import { readApiErrorMessage } from "@/lib/authenticatedApi"

type RatingsByService = Record<string, { average: number; count: number }>

async function publicFetchJson<T>(input: string) {
  const response = await fetch(input)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as { data: T }
  return payload.data
}

export async function getHomeFeaturedData() {
  return publicFetchJson<{
    featuredServices: Service[]
    ratingsByService: RatingsByService
  }>("/api/public/home")
}

export async function getServicesCatalogData() {
  return publicFetchJson<{
    services: Service[]
    ratingsByService: RatingsByService
  }>("/api/public/services")
}

export async function getProviderProfileData(providerId: string) {
  return publicFetchJson<{
    services: Service[]
  }>(`/api/providers/${providerId}`)
}
