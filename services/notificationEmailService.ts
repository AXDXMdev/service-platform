import type { Notification, NotificationPreference } from "@/app/types"
import { logServerInfo } from "@/lib/serverLogger"

export type NotificationEmailPayload = {
  notification: Notification
  recipientUserId: string
  preferences?: NotificationPreference | null
}

export async function enqueueNotificationEmail(input: NotificationEmailPayload) {
  const preferences = input.preferences
  if (preferences) {
    if (!preferences.in_app_enabled) return { ok: true as const, skipped: "in_app_disabled" }
    if (input.notification.type === "new_request" && !preferences.email_new_requests) {
      return { ok: true as const, skipped: "email_new_requests_disabled" }
    }
    if (input.notification.type === "new_message" && !preferences.email_messages) {
      return { ok: true as const, skipped: "email_messages_disabled" }
    }
    if (
      ["request_accepted", "request_declined", "request_completed", "review_available"].includes(input.notification.type) &&
      !preferences.email_status_updates
    ) {
      return { ok: true as const, skipped: "email_status_updates_disabled" }
    }
  }

  logServerInfo("Notification email prepared but not sent", {
    notificationId: input.notification.id,
    recipientUserId: input.recipientUserId,
    type: input.notification.type,
    provider: "none_configured",
  })

  return { ok: true as const, skipped: "provider_not_configured" }
}
