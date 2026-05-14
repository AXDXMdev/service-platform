import { timingSafeEqual } from "node:crypto"

export const ADMIN_COOKIE = "taskora_admin_session"

export function getAdminPassword() {
  return (process.env.ADMIN_PANEL_PASSWORD || "").trim()
}

export function getAdminToken() {
  return (process.env.ADMIN_PANEL_TOKEN || "").trim()
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword() && getAdminToken())
}

export function hasValidAdminCookie(cookieValue: string | undefined) {
  if (!isAdminConfigured()) return false
  if (!cookieValue) return false
  const expected = Buffer.from(getAdminToken())
  const received = Buffer.from(cookieValue)
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}
