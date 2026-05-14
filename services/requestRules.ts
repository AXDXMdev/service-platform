export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled"
  | "deleted"

export function canProviderTransition(
  currentStatus: RequestStatus | null,
  nextStatus: RequestStatus
) {
  const current = currentStatus ?? "pending"
  if (nextStatus === "deleted") return true
  if (current === "pending") return nextStatus === "accepted" || nextStatus === "rejected"
  if (current === "accepted") return nextStatus === "completed"
  return false
}

export function canCustomerTransition(
  currentStatus: RequestStatus | null,
  nextStatus: RequestStatus
) {
  const current = currentStatus ?? "pending"
  if (nextStatus === "deleted") return true
  if (current === "pending") return nextStatus === "cancelled"
  return false
}
