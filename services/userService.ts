import type { User } from "@supabase/supabase-js"
import { LEGAL_CONSENT_VERSION } from "@/lib/legal"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { isMissingSchemaError } from "@/services/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function addFavorite(
  supabase: SupabasePublicClient,
  user: User,
  input: { serviceId: string }
) {
  const service = await supabase
    .from("services")
    .select("id,user_id")
    .eq("id", input.serviceId)
    .single()

  if (service.error || !service.data) {
    return { ok: false as const, status: 404, message: "Service wurde nicht gefunden." }
  }

  if (service.data.user_id === user.id) {
    return { ok: false as const, status: 403, message: "Eigene Services koennen nicht favorisiert werden." }
  }

  const existing = await supabase
    .from("favorites")
    .select("id,user_id,service_id,created_at")
    .eq("user_id", user.id)
    .eq("service_id", input.serviceId)
    .maybeSingle()

  if (existing.data) {
    return { ok: true as const, data: existing.data }
  }

  const insert = await supabase
    .from("favorites")
    .insert([
      {
        user_id: user.id,
        service_id: input.serviceId,
      },
    ])
    .select("*")
    .single()

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Favorit konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data }
}

export async function removeFavorite(
  supabase: SupabasePublicClient,
  user: User,
  input: { serviceId: string }
) {
  const remove = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("service_id", input.serviceId)

  if (remove.error) {
    return { ok: false as const, status: 500, message: "Favorit konnte nicht entfernt werden." }
  }

  return { ok: true as const, data: { serviceId: input.serviceId } }
}

export async function createWaitlistEntry(
  supabase: SupabasePublicClient,
  input: {
    fullName: string
    email: string
    city: string
    role: "customer" | "provider" | "volunteer"
    note: string | null
    marketingAccepted: boolean
  }
) {
  const now = new Date().toISOString()
  let insert = await supabase
    .from("waitlist_entries")
    .insert([
      {
        full_name: input.fullName,
        email: input.email,
        city: input.city,
        role: input.role,
        note: input.note,
        privacy_accepted_at: now,
        marketing_opt_in: input.marketingAccepted,
        marketing_opt_in_at: input.marketingAccepted ? now : null,
        consent_version: LEGAL_CONSENT_VERSION,
      },
    ])
    .select("id,created_at")
    .single()

  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase
      .from("waitlist_entries")
      .insert([
        {
          full_name: input.fullName,
          email: input.email,
          city: input.city,
          role: input.role,
          note: input.note,
        },
      ])
      .select("id,created_at")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Wartelisten-Eintrag konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data }
}
