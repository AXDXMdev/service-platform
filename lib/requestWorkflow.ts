import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import {
  canCustomerTransition,
  canProviderTransition,
  type RequestStatus,
} from "@/services/requestRules"

export const visibleRequestStatuses = [
  "pending",
  "accepted",
  "rejected",
  "completed",
  "cancelled",
] as const

export type { RequestStatus } from "@/services/requestRules"

export function statusLabel(status: RequestStatus | null) {
  switch (status) {
    case "accepted":
      return "Angenommen"
    case "rejected":
    case "declined":
      return "Abgelehnt"
    case "completed":
      return "Abgeschlossen"
    case "cancelled":
      return "Zurückgezogen"
    case "deleted":
      return "Gelöscht"
    default:
      return "Offen"
  }
}

export function statusTone(status: RequestStatus | null) {
  switch (status) {
    case "accepted":
      return "border border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
    case "rejected":
    case "declined":
      return "border border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-300"
    case "completed":
      return "border border-blue-500/35 bg-blue-500/15 text-blue-800 dark:text-blue-300"
    case "cancelled":
      return "border border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300"
    case "deleted":
      return "border border-slate-500/35 bg-slate-500/15 text-slate-800 dark:text-slate-300"
    default:
      return "border border-slate-400/35 bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
  }
}

export function requestStatusRank(status: RequestStatus | null) {
  switch (status) {
    case "pending":
      return 0
    case "accepted":
      return 1
    case "completed":
      return 2
    case "rejected":
    case "declined":
      return 3
    case "cancelled":
      return 4
    case "deleted":
      return 5
    default:
      return 6
  }
}

export { canCustomerTransition, canProviderTransition }

export async function updateRequestStatus(input: {
  requestId: string
  nextStatus: RequestStatus
  currentStatus: string | null
  actorId: string | null
  note?: string | null
}) {
  if (!input.actorId) {
    throw new Error("Login erforderlich.")
  }

  const response = await authenticatedFetch(`/api/requests/${input.requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      nextStatus: input.nextStatus,
      note: input.note ?? null,
    }),
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  return response.json()
}

export async function updateProviderOffer(input: {
  requestId: string
  providerOfferEur: number
}) {
  const response = await authenticatedFetch(`/api/requests/${input.requestId}/offer`, {
    method: "PATCH",
    body: JSON.stringify({
      providerOfferEur: input.providerOfferEur,
    }),
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  return response.json()
}

export async function createServiceRequest(input: {
  serviceId: string
  message: string
  customerBudgetEur: number | null
  preferredDate?: string | null
  location?: string | null
  contactPreference?: string | null
}) {
  const response = await authenticatedFetch("/api/requests", {
    method: "POST",
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response))
  }

  return response.json()
}
