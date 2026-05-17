import { apiOk } from "@/lib/apiResponse"
import { captureObservabilityEvent } from "@/lib/observability"
import { readJsonBody } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"
import { normalizeText } from "@/lib/validation"

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["observability", ip]), 30, 10 * 60 * 1000)) {
    return apiOk({ accepted: true })
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response

  const level = json.body.level === "info" || json.body.level === "warning" ? json.body.level : "error"
  const message = normalizeText(String(json.body.message ?? "Client error"), 300)

  await captureObservabilityEvent({
    level,
    message,
    route: normalizeText(String(json.body.route ?? ""), 160) || undefined,
    context: {
      source: normalizeText(String(json.body.source ?? ""), 300) || undefined,
      line: typeof json.body.line === "number" ? json.body.line : undefined,
      column: typeof json.body.column === "number" ? json.body.column : undefined,
      userAgent: request.headers.get("user-agent"),
    },
  })

  return apiOk({ accepted: true })
}
