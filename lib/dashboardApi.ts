import type { Review, Service, ServiceRequest, ChatMessage, Favorite, Notification } from "@/app/types"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import type { InboxRequestSummary } from "@/services/inboxService"

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

export async function getInboxData() {
  const response = await authenticatedFetch("/api/dashboard/inbox")
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      requests: InboxRequestSummary[]
      services: Service[]
      reviews: Review[]
    }
  }

  return payload.data
}

export async function getRequestDetailData(requestId: string) {
  const response = await authenticatedFetch(`/api/dashboard/requests/${requestId}`)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      currentUserId: string
      role: "customer" | "provider"
      request: ServiceRequest
      service: Service
      messages: ChatMessage[]
      review: Review | null
    }
  }

  return payload.data
}

export async function markRequestRead(requestId: string) {
  const response = await authenticatedFetch(`/api/dashboard/requests/${requestId}/read`, {
    method: "PATCH",
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }
}

export async function getNotificationsData() {
  const response = await authenticatedFetch("/api/notifications")
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  const payload = (await response.json()) as {
    data: {
      notifications: Notification[]
      unreadCount: number
    }
  }

  return payload.data
}

export async function markNotificationRead(notificationId: string) {
  const response = await authenticatedFetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    body: JSON.stringify({}),
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
}

export async function markAllNotificationsRead() {
  const response = await authenticatedFetch("/api/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({}),
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
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
