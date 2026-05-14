type Bucket = { count: number; resetAt: number }

const rateBuckets = new Map<string, Bucket>()

export function isRateLimited(key: string, max = 10, windowMs = 10 * 60 * 1000) {
  if (process.env.NODE_ENV !== "production") return false

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

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
