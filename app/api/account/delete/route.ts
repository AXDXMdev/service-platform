import { apiError, apiOk } from "@/lib/apiResponse"
import { readJsonBody } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import { requireAuthenticatedUser } from "@/lib/serverAuth"
import { createServerSupabaseAdminClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerError, logServerWarn } from "@/lib/serverLogger"
import { normalizeText } from "@/lib/validation"

type DeleteMode = "request" | "delete_now"

async function safeInsertDeletionRequest(
  userId: string,
  email: string | null,
  reason: string,
  mode: DeleteMode,
  request: Request
) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.error || !auth.supabase) {
    return
  }

  await auth.supabase.from("account_deletion_requests").insert([
    {
      user_id: userId,
      email,
      reason: reason || null,
      mode,
      status: mode === "delete_now" ? "processing" : "pending",
    },
  ])
}

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["account-delete", ip]), 5, 15 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Löschungsversuche. Bitte später erneut.")
  }

  const auth = await requireAuthenticatedUser(request)
  if (auth.error || !auth.user) return auth.error
  if (
    await isRateLimitedAsync(
      buildRateLimitKey(["account-delete-user", auth.user.id]),
      3,
      60 * 60 * 1000
    )
  ) {
    return apiError(429, "rate_limited", "Zu viele Löschungsversuche für dieses Konto.")
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const body = json.body as
    | { mode?: DeleteMode; confirmationText?: string; reason?: string }

  const mode: DeleteMode = body?.mode === "delete_now" ? "delete_now" : "request"
  const confirmationText = normalizeText(body?.confirmationText ?? "", 40)
  const reason = normalizeText(body?.reason ?? "", 1000)

  if (confirmationText !== "LOESCHEN") {
    return apiError(400, "bad_request", 'Bitte bestätige die Löschung mit dem Text "LOESCHEN".')
  }

  const user = auth.user
  const userEmail = user.email ?? null

  if (mode === "request") {
    await safeInsertDeletionRequest(user.id, userEmail, reason, mode, request)
    return apiOk({
      mode,
      status: "pending",
      message:
        "Dein Löschungsantrag wurde gespeichert. Wir prüfen, ob gesetzliche Aufbewahrungspflichten entgegenstehen.",
    })
  }

  if (!getSupabaseServiceRoleEnv()) {
    await safeInsertDeletionRequest(user.id, userEmail, reason, "request", request)
    return apiError(
      503,
      "configuration_error",
      "Direkte Kontolöschung ist aktuell nicht verfuegbar. Dein Antrag wurde stattdessen zur manuellen Bearbeitung gespeichert."
    )
  }

  const admin = createServerSupabaseAdminClient()
  if (!admin) {
    return apiError(503, "configuration_error", "Supabase Admin Client konnte nicht initialisiert werden.")
  }

  const requestInsert = await admin
    .from("account_deletion_requests")
    .insert([
      {
        user_id: user.id,
        email: userEmail,
        reason: reason || null,
        mode,
        status: "processing",
      },
    ])
    .select("id")
    .single()

  const deletionRequestId = requestInsert.data?.id ?? null

  const markDeletionRequest = async (status: "completed" | "failed") => {
    if (!deletionRequestId) return
    await admin
      .from("account_deletion_requests")
      .update({
        status,
        processed_at: new Date().toISOString(),
      })
      .eq("id", deletionRequestId)
  }

  try {
    const serviceIdsResult = await admin.from("services").select("id").eq("user_id", user.id)
    if (serviceIdsResult.error) throw serviceIdsResult.error
    const serviceIds = (serviceIdsResult.data ?? []).map((item) => item.id)

    if (serviceIds.length > 0) {
      const serviceDelete = await admin.from("services").delete().in("id", serviceIds)
      if (serviceDelete.error) throw serviceDelete.error
    }

    const deleteOperations = await Promise.all([
      admin.from("favorites").delete().eq("user_id", user.id),
      admin.from("chat_messages").delete().eq("sender_id", user.id),
      admin.from("requests").delete().eq("sender_id", user.id),
      admin.from("provider_verification_requests").delete().eq("user_id", user.id),
      admin.from("reviews").delete().eq("reviewer_id", user.id),
      userEmail ? admin.from("waitlist_entries").delete().eq("email", userEmail) : Promise.resolve({ error: null }),
      admin.from("profiles").delete().eq("user_id", user.id),
    ])

    for (const operation of deleteOperations) {
      if ("error" in operation && operation.error) throw operation.error
    }

    const listed = await admin.storage.from("service-media").list(user.id, { limit: 100 })
    if (listed.error) {
      logServerWarn("Service media list failed during account deletion", {
        userId: user.id,
        error: listed.error.message,
      })
    } else if ((listed.data ?? []).length > 0) {
      const paths = (listed.data ?? []).map((file) => `${user.id}/${file.name}`)
      const removeResult = await admin.storage.from("service-media").remove(paths)
      if (removeResult.error) {
        logServerWarn("Service media removal failed during account deletion", {
          userId: user.id,
          error: removeResult.error.message,
        })
      }
    }

    const deleteUserResult = await admin.auth.admin.deleteUser(user.id)
    if (deleteUserResult.error) throw deleteUserResult.error

    await markDeletionRequest("completed")
    return apiOk({
      mode,
      status: "completed",
      message: "Dein Konto wurde geloescht. Bitte schliesse offene Browser-Tabs und melde dich nicht erneut an.",
    })
  } catch (error) {
    await markDeletionRequest("failed")
    const message = error instanceof Error ? error.message : String(error)
    logServerError("Account deletion failed", {
      userId: user.id,
      error: message,
    })
    return apiError(500, "upstream_error", "Kontolöschung fehlgeschlagen. Bitte kontaktiere den Support.")
  }
}
