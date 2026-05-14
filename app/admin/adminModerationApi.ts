import type { PendingReviewRow, ProviderVerificationRequestRow, WaitlistRow } from "@/app/admin/adminShared"

type AdminModerationClientAction =
  | { action: "updateWaitlistStatus"; payload: { actorUserId: string; entryId: string; status: string } }
  | { action: "approveProviderVerification"; payload: { actorUserId: string; requestId: string; providerUserId: string } }
  | { action: "rejectProviderVerification"; payload: { actorUserId: string; requestId: string } }
  | { action: "approveReviewProof"; payload: { actorUserId: string; reviewId: string } }

export async function postAdminModerationAction(action: AdminModerationClientAction) {
  const response = await fetch("/api/admin/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Admin-Moderationsaktion fehlgeschlagen.")
  }

  return payload.data
}

export function buildWaitlistStatusAction(actorUserId: string, entry: WaitlistRow): AdminModerationClientAction {
  return {
    action: "updateWaitlistStatus",
    payload: { actorUserId, entryId: entry.id, status: entry.status },
  }
}

export function buildApproveVerificationAction(
  actorUserId: string,
  request: ProviderVerificationRequestRow
): AdminModerationClientAction {
  return {
    action: "approveProviderVerification",
    payload: {
      actorUserId,
      requestId: request.id,
      providerUserId: request.user_id,
    },
  }
}

export function buildRejectVerificationAction(
  actorUserId: string,
  request: ProviderVerificationRequestRow
): AdminModerationClientAction {
  return {
    action: "rejectProviderVerification",
    payload: {
      actorUserId,
      requestId: request.id,
    },
  }
}

export function buildApproveReviewAction(
  actorUserId: string,
  review: PendingReviewRow
): AdminModerationClientAction {
  return {
    action: "approveReviewProof",
    payload: {
      actorUserId,
      reviewId: review.id,
    },
  }
}
