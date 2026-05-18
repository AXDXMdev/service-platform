import { timingSafeEqual } from "node:crypto"
import { getServerEnv } from "@/lib/env"

export function hasValidCronSecret(request: Request) {
  const expected = getServerEnv().CRON_SECRET
  if (!expected) return false

  const authHeader = request.headers.get("authorization")
  const provided =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : request.headers.get("x-cron-secret")

  if (!provided) return false

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)
  if (expectedBuffer.length !== providedBuffer.length) return false

  return timingSafeEqual(expectedBuffer, providedBuffer)
}
