import { getServerEnv } from "@/lib/env"

type ObservabilityLevel = "info" | "warning" | "error"

export type ObservabilityEvent = {
  level: ObservabilityLevel
  message: string
  route?: string
  requestId?: string
  userId?: string | null
  durationMs?: number
  tags?: Record<string, string>
  context?: Record<string, unknown>
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item))
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      /authorization|cookie|password|secret|token|key|email/i.test(key)
        ? "[redacted]"
        : redact(entry),
    ])
  )
}

function parseDsn(dsn: string) {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace("/", "")
    const publicKey = url.username
    if (!projectId || !publicKey) return null
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey,
      host: url.host,
    }
  } catch {
    return null
  }
}

async function sendToSentry(event: ObservabilityEvent) {
  const env = getServerEnv()
  const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  const parsed = parseDsn(dsn)
  if (!parsed) return

  const now = new Date().toISOString()
  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: now,
    platform: "javascript",
    level: event.level,
    message: event.message,
    tags: event.tags,
    contexts: {
      hilfinio: redact(event.context ?? {}),
      trace: {
        request_id: event.requestId,
        route: event.route,
        duration_ms: event.durationMs,
      },
    },
    user: event.userId ? { id: event.userId } : undefined,
  }

  const envelope = [
    JSON.stringify({ sent_at: now, dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(payload),
  ].join("\n")

  await fetch(parsed.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=hilfinio-observability/1.0`,
    },
    body: envelope,
    cache: "no-store",
  }).catch(() => undefined)
}

async function sendToCustomIngest(event: ObservabilityEvent) {
  const env = getServerEnv()
  if (!env.OBSERVABILITY_INGEST_URL) return

  await fetch(env.OBSERVABILITY_INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.OBSERVABILITY_INGEST_TOKEN
        ? { Authorization: `Bearer ${env.OBSERVABILITY_INGEST_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      ...event,
      context: redact(event.context ?? {}),
      timestamp: new Date().toISOString(),
    }),
    cache: "no-store",
  }).catch(() => undefined)
}

export async function captureObservabilityEvent(event: ObservabilityEvent) {
  await Promise.all([sendToSentry(event), sendToCustomIngest(event)])
}

export function trackServerError(message: string, context: Record<string, unknown> = {}) {
  void captureObservabilityEvent({
    level: "error",
    message,
    route: typeof context.route === "string" ? context.route : undefined,
    requestId: typeof context.requestId === "string" ? context.requestId : undefined,
    userId: typeof context.userId === "string" ? context.userId : null,
    durationMs: typeof context.durationMs === "number" ? context.durationMs : undefined,
    context,
  })
}
