import { getServerEnv } from "@/lib/env"
import { logServerWarn } from "@/lib/serverLogger"

type Bucket = { count: number; resetAt: number }

const rateBuckets = new Map<string, Bucket>()
const upstashTimeoutMs = 900

export function isRateLimited(key: string, max = 10, windowMs = 10 * 60 * 1000) {
  if (process.env.NODE_ENV !== "production") return false

  return isLocalRateLimited(key, max, windowMs)
}

function isLocalRateLimited(key: string, max = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const current = rateBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  current.count += 1
  rateBuckets.set(key, current)
  return current.count > max
}

function getUpstashConfig() {
  const env = getServerEnv()
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null
  return {
    url: env.UPSTASH_REDIS_REST_URL.replace(/\/$/, ""),
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }
}

async function upstashCommand<T>(command: unknown[]) {
  const config = getUpstashConfig()
  if (!config) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), upstashTimeoutMs)

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Upstash returned ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    logServerWarn("Distributed rate limit unavailable; using local fallback", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function isRateLimitedAsync(
  key: string,
  max = 10,
  windowMs = 10 * 60 * 1000
) {
  if (process.env.NODE_ENV !== "production") return false

  const config = getUpstashConfig()
  if (!config) return isLocalRateLimited(key, max, windowMs)

  const redisKey = `rl:${key}`
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const result = await upstashCommand<Array<{ result: number | string | null }>>([
    ["INCR", redisKey],
    ["EXPIRE", redisKey, ttlSeconds, "NX"],
  ])

  const count = Number(result?.[0]?.result ?? 0)
  if (!Number.isFinite(count) || count <= 0) {
    return isLocalRateLimited(key, max, windowMs)
  }

  return count > max
}

export function buildRateLimitKey(parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 120))
    .join(":")
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
