export const BETA_ACCESS_COOKIE = "hilfinio_beta_access"

export function getBetaAccessCode() {
  return process.env.BETA_ACCESS_CODE?.trim() ?? ""
}

export function getBetaAccessToken() {
  return process.env.BETA_ACCESS_TOKEN?.trim() || getBetaAccessCode()
}

export function isBetaGateEnabled() {
  return Boolean(getBetaAccessCode() && getBetaAccessToken())
}

export function hasValidBetaAccess(cookieValue: string | undefined) {
  if (!isBetaGateEnabled()) return true
  return Boolean(cookieValue && cookieValue === getBetaAccessToken())
}

export function isBetaExemptPath(pathname: string) {
  return (
    pathname === "/beta" ||
    pathname.startsWith("/beta/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/api") ||
    pathname === "/waitlist" ||
    pathname === "/impressum" ||
    pathname === "/datenschutz" ||
    pathname === "/agb" ||
    pathname === "/cookie-einstellungen" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest"
  )
}
