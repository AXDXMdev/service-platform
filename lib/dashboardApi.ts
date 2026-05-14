import type { Review, Service, ServiceRequest, ChatMessage, Favorite } from "@/app/types"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"

export async function getProviderDashboardData() {
  const response = await authenticatedFetch("/api/dashboard/provider")
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      services: Service[]
      requests: ServiceRequest[]
    }
  }

  return payload.data
}

export async function getCustomerDashboardData() {
  const response = await authenticatedFetch("/api/dashboard/customer")
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      requests: ServiceRequest[]
      services: Service[]
      reviews: Review[]
    }
  }

  return payload.data
}

export async function getChatMessages(requestId: string) {
  const response = await authenticatedFetch(`/api/chat/${requestId}`)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      requestId: string
      messages: ChatMessage[]
    }
  }

  return payload.data
}

export async function getFavoritesData() {
  const response = await authenticatedFetch("/api/favorites/list")
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      favorites: Favorite[]
      services: Service[]
    }
  }

  return payload.data
}

export async function getServiceDetailData(serviceId: string) {
  const response = await authenticatedFetch(`/api/services/${serviceId}`)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string | null
      service: Service
      isFavorite: boolean
      ratingCount: number
      ratingAverage: number | null
    }
  }

  return payload.data
}
