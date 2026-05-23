const PRODUCTION_ORIGIN = "https://hilfinio.de"
const LOCAL_ORIGIN = "http://localhost:3000"

type AuthRedirectEnv = Partial<Record<string, string | undefined>>

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "")
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function sanitizeAuthNextPath(value: string | null | undefined, fallback = "/dashboard") {
  const rawValue = value?.trim()
  if (!rawValue) return fallback

  const decodedValue = safeDecode(rawValue)
  if (!decodedValue.startsWith("/") || decodedValue.startsWith("//") || decodedValue.includes("\\")) {
    return fallback
  }

  const parsed = new URL(decodedValue, PRODUCTION_ORIGIN)
  if (parsed.origin !== PRODUCTION_ORIGIN) return fallback

  return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback
}

export function getAuthBaseUrl(env: AuthRedirectEnv = process.env) {
  const vercelEnv = env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV
  const vercelUrl = env.NEXT_PUBLIC_VERCEL_URL || env.VERCEL_URL

  if (vercelEnv === "preview" && vercelUrl) {
    return stripTrailingSlash(vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`)
  }

  if (env.NODE_ENV === "production") return PRODUCTION_ORIGIN

  const configuredUrl = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredUrl && !/localhost|127\.0\.0\.1/i.test(configuredUrl)) {
    return stripTrailingSlash(configuredUrl)
  }

  return LOCAL_ORIGIN
}

export function getAuthRedirectUrl(path = "/auth/callback?next=/dashboard", env: AuthRedirectEnv = process.env) {
  return new URL(sanitizeAuthNextPath(path, "/dashboard"), getAuthBaseUrl(env)).toString()
}
