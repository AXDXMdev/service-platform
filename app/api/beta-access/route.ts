import { apiError, apiOk } from "@/lib/apiResponse"
import {
  BETA_ACCESS_COOKIE,
  getBetaAccessCode,
  getBetaAccessToken,
  isBetaGateEnabled,
} from "@/lib/betaAccess"
import { readJsonBody, requireSameOrigin } from "@/lib/requestSecurity"
import { buildRateLimitKey, getRequestIp, isRateLimitedAsync } from "@/lib/serverRateLimit"

export async function POST(request: Request) {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  if (!isBetaGateEnabled()) {
    return apiOk({ unlocked: true, disabled: true })
  }

  const ip = getRequestIp(request)
  if (await isRateLimitedAsync(buildRateLimitKey(["beta-access", ip]), 12, 15 * 60 * 1000)) {
    return apiError(429, "rate_limited", "Zu viele Versuche. Bitte später erneut.")
  }

  const json = await readJsonBody(request)
  if (!json.ok) return json.response

  const code = String(json.body.code ?? "").trim()
  if (!code || code.length > 120 || code !== getBetaAccessCode()) {
    return apiError(401, "unauthorized", "Der Zugangscode ist nicht korrekt.")
  }

  const response = apiOk({ unlocked: true })
  response.cookies.set({
    name: BETA_ACCESS_COOKIE,
    value: getBetaAccessToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
