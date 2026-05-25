import { timingSafeEqual } from "node:crypto"
import { getServerEnv } from "@/lib/env"

export const ADMIN_COOKIE = "taskora_admin_session"

export function getAdminPassword() {
  const env = getServerEnv()
  return env.ADMIN_PANEL_PASSWORD ?? env.ADMIN_PANEL_SECRET ?? ""
}

export function getAdminToken() {
  return getServerEnv().ADMIN_PANEL_TOKEN ?? ""
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
