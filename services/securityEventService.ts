import { createHash } from "node:crypto"
import { createServerSupabaseAdminClient } from "@/lib/serverSupabase"

type AdminClient = NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>

export type SecurityEventSeverity = "info" | "warning" | "critical"

function hashIp(ip: string | null | undefined) {
  if (!ip || ip === "unknown") return null
  return createHash("sha256").update(ip).digest("hex")
}

export async function recordSecurityEvent(
  admin: AdminClient,
  input: {
    actorUserId?: string | null
    eventType: string
    severity?: SecurityEventSeverity
    route?: string | null
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown>
  }
) {
  await admin.from("security_events").insert([
    {
      actor_user_id: input.actorUserId ?? null,
      event_type: input.eventType,
      severity: input.severity ?? "info",
      route: input.route ?? null,
      ip_hash: hashIp(input.ip),
      user_agent: input.userAgent ? input.userAgent.slice(0, 500) : null,
      metadata: input.metadata ?? {},
    },
  ])
}
