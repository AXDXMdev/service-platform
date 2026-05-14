import { normalizeText } from "@/lib/validation"
import { adminSaveError } from "@/app/admin/adminShared"
import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type SupabaseAdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

export type AdminModerationAction =
  | {
      action: "updateWaitlistStatus"
      payload: { actorUserId: string; entryId: string; status: string }
    }
  | {
      action: "approveProviderVerification"
      payload: { actorUserId: string; requestId: string; providerUserId: string }
    }
  | {
      action: "rejectProviderVerification"
      payload: { actorUserId: string; requestId: string }
    }
  | {
      action: "approveReviewProof"
      payload: { actorUserId: string; reviewId: string }
    }

const ALLOWED_WAITLIST_STATUSES = new Set(["new", "contacted", "converted", "archived"])

async function requirePrivilegedActor(supabase: SupabaseAdminClient, actorUserId: string) {
  const resolvedActorUserId = normalizeText(actorUserId, 80)
  if (!resolvedActorUserId) {
    return { ok: false as const, status: 401, message: "Admin-User fehlt." }
  }

  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", resolvedActorUserId)
    .maybeSingle()

  if (profile.error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(profile.error.message),
    }
  }

  const role = profile.data?.role ?? null
  if (!role || !["admin", "moderator"].includes(role)) {
    return { ok: false as const, status: 403, message: "Keine Admin-/Moderator-Berechtigung." }
  }

  return { ok: true as const, actorUserId: resolvedActorUserId, role }
}

async function updateWaitlistStatus(
  supabase: SupabaseAdminClient,
  payload: { actorUserId: string; entryId: string; status: string }
) {
  const guard = await requirePrivilegedActor(supabase, payload.actorUserId)
  if (!guard.ok) return guard

  const status = normalizeText(payload.status, 40)
  const entryId = normalizeText(payload.entryId, 80)
  if (!entryId || !ALLOWED_WAITLIST_STATUSES.has(status)) {
    return { ok: false as const, status: 400, message: "Ungültiger Wartelisten-Status." }
  }

  const update = await supabase
    .from("waitlist_entries")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", entryId)

  if (update.error) {
    return { ok: false as const, status: 500, message: adminSaveError(update.error.message) }
  }

  return { ok: true as const, message: "Warteliste aktualisiert." }
}

async function approveProviderVerification(
  supabase: SupabaseAdminClient,
  payload: { actorUserId: string; requestId: string; providerUserId: string }
) {
  const guard = await requirePrivilegedActor(supabase, payload.actorUserId)
  if (!guard.ok) return guard

  const requestId = normalizeText(payload.requestId, 80)
  const providerUserId = normalizeText(payload.providerUserId, 80)
  if (!requestId || !providerUserId) {
    return { ok: false as const, status: 400, message: "Verifizierungsdaten fehlen." }
  }

  const serviceUpdate = await supabase
    .from("services")
    .update({ is_verified: true })
    .eq("user_id", providerUserId)
  const requestUpdate = await supabase
    .from("provider_verification_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId)

  if (serviceUpdate.error || requestUpdate.error) {
    return {
      ok: false as const,
      status: 500,
      message: adminSaveError(serviceUpdate.error?.message ?? requestUpdate.error?.message),
    }
  }

  return { ok: true as const, message: "Anbieter verifiziert." }
}

async function rejectProviderVerification(
  supabase: SupabaseAdminClient,
  payload: { actorUserId: string; requestId: string }
) {
  const guard = await requirePrivilegedActor(supabase, payload.actorUserId)
  if (!guard.ok) return guard

  const requestId = normalizeText(payload.requestId, 80)
  if (!requestId) {
    return { ok: false as const, status: 400, message: "Verifizierungsanfrage fehlt." }
  }

  const update = await supabase
    .from("provider_verification_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId)

  if (update.error) {
    return { ok: false as const, status: 500, message: adminSaveError(update.error.message) }
  }

  return { ok: true as const, message: "Antrag abgelehnt." }
}

async function approveReviewProof(
  supabase: SupabaseAdminClient,
  payload: { actorUserId: string; reviewId: string }
) {
  const guard = await requirePrivilegedActor(supabase, payload.actorUserId)
  if (!guard.ok) return guard

  const reviewId = normalizeText(payload.reviewId, 80)
  if (!reviewId) {
    return { ok: false as const, status: 400, message: "Review-ID fehlt." }
  }

  const update = await supabase
    .from("reviews")
    .update({
      proof_validated: true,
      validated_by: guard.actorUserId,
      validated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)

  if (update.error) {
    return { ok: false as const, status: 500, message: adminSaveError(update.error.message) }
  }

  return { ok: true as const, message: "Review freigegeben." }
}

export async function executeAdminModerationAction(
  supabase: SupabaseAdminClient,
  input: AdminModerationAction
) {
  switch (input.action) {
    case "updateWaitlistStatus":
      return updateWaitlistStatus(supabase, input.payload)
    case "approveProviderVerification":
      return approveProviderVerification(supabase, input.payload)
    case "rejectProviderVerification":
      return rejectProviderVerification(supabase, input.payload)
    case "approveReviewProof":
      return approveReviewProof(supabase, input.payload)
    default:
      return {
        ok: false as const,
        status: 400,
        message: "Unbekannte Moderations-Aktion.",
      }
  }
}
