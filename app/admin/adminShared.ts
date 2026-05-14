import { normalizeText } from "@/lib/validation"
import type { RequestEvent } from "@/app/types"

export type Role = "admin" | "moderator" | "provider" | "customer"

export type ServiceAdminRow = {
  id: string
  title: string
  description: string | null
  city: string | null
  provider_name: string | null
  user_id: string | null
  price_from_eur: number | null
  is_verified: boolean | null
  is_active: boolean | null
  is_featured: boolean | null
}

export type ProviderRow = {
  user_id: string
  role: Role
  full_name: string | null
  city: string | null
  contact_email: string | null
  verification_level: string
  is_visible: boolean
}

export type WaitlistRow = {
  id: string
  full_name: string
  email: string | null
  city: string
  role: string
  status: string
  created_at: string
}

export type ProviderVerificationRequestRow = {
  id: string
  user_id: string
  company_name: string
  contact_email: string | null
  city: string
  website: string | null
  proof_urls: string[] | null
  status: string
  created_at: string
}

export type PendingReviewRow = {
  id: string
  rating: number
  comment: string | null
  proof_image_urls: string[] | null
  reviewer_id: string
  service_id: string
  service_title: string | null
}

export type AuditEventRow = RequestEvent & {
  service_title: string | null
  sender_email: string | null
}

export function toLines(value: string[]) {
  return value.join("\n")
}

export function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => normalizeText(item, 200))
    .filter(Boolean)
}

export function toCsv(rows: WaitlistRow[]) {
  const header = ["id", "name", "email", "city", "role", "status", "created_at"]
  const body = rows.map((row) =>
    [row.id, row.full_name, row.email ?? "", row.city, row.role, row.status, row.created_at]
      .map((item) => `"${String(item).replace(/"/g, '""')}"`)
      .join(",")
  )
  return [header.join(","), ...body].join("\n")
}

export function isMissingTable(errorMessage: string) {
  return /relation .* does not exist|schema|table|column/i.test(errorMessage)
}

export function adminSaveError(message: string | undefined) {
  if (!message) return "Unbekannter Fehler."
  if (/row-level security|policy|violates/i.test(message)) {
    return `${message} Bitte docs/supabase-steps/07_admin_rls_theme_fix.sql komplett in Supabase ausführen und prüfen, ob dein Supabase-User in public.profiles die Rolle admin hat.`
  }
  return message
}
