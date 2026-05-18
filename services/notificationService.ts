import type { Notification, NotificationPreference, NotificationType } from "@/app/types"
import { createServerSupabaseAdminClient, createServerSupabasePublicClient, getSupabaseServiceRoleEnv } from "@/lib/serverSupabase"
import { logServerWarn } from "@/lib/serverLogger"
import { normalizeText } from "@/lib/validation"
import { isMissingSchemaError } from "@/services/validation"
import { enqueueNotificationEmail } from "@/services/notificationEmailService"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>
type SupabaseAdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

export type NotificationCreateInput = {
  userId: string | null | undefined
  actorId?: string | null
  type: NotificationType
  requestId?: string | null
  serviceId?: string | null
  title: string
  body: string
}

export async function createNotification(input: NotificationCreateInput) {
  if (!input.userId || input.userId === input.actorId) {
    return { ok: true as const, skipped: "self_or_missing_recipient" }
  }

  if (!getSupabaseServiceRoleEnv()) {
    logServerWarn("Notification skipped because service role env is missing", {
      type: input.type,
      requestId: input.requestId ?? null,
    })
    return { ok: true as const, skipped: "service_role_missing" }
  }

  const admin = createServerSupabaseAdminClient()
  if (!admin) return { ok: true as const, skipped: "service_role_missing" }
  return createNotificationWithClient(admin, input)
}

export async function createNotificationWithClient(
  supabase: SupabaseAdminClient | SupabasePublicClient,
  input: NotificationCreateInput
) {
  if (!input.userId || input.userId === input.actorId) {
    return { ok: true as const, skipped: "self_or_missing_recipient" }
  }

  const preferences = await getNotificationPreferences(supabase, input.userId)
  if (preferences && preferences.in_app_enabled === false) {
    return { ok: true as const, skipped: "in_app_disabled" }
  }

  const insert = await supabase
    .from("notifications")
    .insert([
      {
        user_id: input.userId,
        actor_id: input.actorId ?? null,
        type: input.type,
        request_id: input.requestId ?? null,
        service_id: input.serviceId ?? null,
        title: normalizeText(input.title, 140),
        body: normalizeText(input.body, 500),
      },
    ])
    .select("*")
    .single()

  if (insert.error) {
    if (isMissingSchemaError(insert.error.message)) {
      return { ok: true as const, skipped: "notifications_not_migrated" }
    }
    logServerWarn("Notification insert failed", {
      type: input.type,
      requestId: input.requestId ?? null,
      error: insert.error.message,
    })
    return { ok: false as const, error: insert.error.message }
  }

  await enqueueNotificationEmail({
    notification: insert.data as Notification,
    recipientUserId: input.userId,
    preferences,
  }).catch((error) => {
    logServerWarn("Notification email preparation failed", {
      notificationId: (insert.data as Notification).id,
      error: error instanceof Error ? error.message : String(error),
    })
  })

  return { ok: true as const, data: insert.data as Notification }
}

async function getNotificationPreferences(
  supabase: SupabaseAdminClient | SupabasePublicClient,
  userId: string
) {
  const result = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (result.error) return null
  return (result.data as NotificationPreference | null) ?? null
}

export async function listNotifications(supabase: SupabasePublicClient, userId: string) {
  const result = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<Notification[]>()

  if (result.error) {
    if (isMissingSchemaError(result.error.message)) {
      return { ok: true as const, data: { notifications: [], unreadCount: 0 } }
    }
    return { ok: false as const, status: 500, message: "Notifications konnten nicht geladen werden." }
  }

  const notifications = result.data ?? []
  return {
    ok: true as const,
    data: {
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read_at).length,
    },
  }
}

export async function markNotificationRead(
  supabase: SupabasePublicClient,
  userId: string,
  notificationId: string
) {
  const cleanId = normalizeText(notificationId, 80)
  if (!cleanId) return { ok: false as const, status: 400, message: "Notification fehlt." }

  const update = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", cleanId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle()

  if (update.error) {
    if (isMissingSchemaError(update.error.message)) {
      return { ok: false as const, status: 404, message: "Notifications sind noch nicht aktiviert." }
    }
    return { ok: false as const, status: 500, message: "Notification konnte nicht aktualisiert werden." }
  }

  if (!update.data) return { ok: false as const, status: 404, message: "Notification wurde nicht gefunden." }
  return { ok: true as const, data: { id: cleanId } }
}

export async function markAllNotificationsRead(supabase: SupabasePublicClient, userId: string) {
  const update = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  if (update.error) {
    if (isMissingSchemaError(update.error.message)) {
      return { ok: true as const, data: { updated: true } }
    }
    return { ok: false as const, status: 500, message: "Notifications konnten nicht aktualisiert werden." }
  }

  return { ok: true as const, data: { updated: true } }
}
