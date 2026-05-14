import type { User } from "@supabase/supabase-js"
import { createServerSupabasePublicClient } from "@/lib/serverSupabase"
import { LEGAL_CONSENT_VERSION } from "@/lib/legal"
import { isMissingSchemaError } from "@/services/validation"

type SupabasePublicClient = NonNullable<ReturnType<typeof createServerSupabasePublicClient>>

export async function createServiceListing(
  supabase: SupabasePublicClient,
  user: User,
  input: {
    title: string
    description: string
    providerName: string
    providerBio: string | null
    city: string
    district: string | null
    yearsExperience: number | null
    serviceRadiusKm: number | null
    approxLat: number | null
    approxLng: number | null
    isVolunteer: boolean
    supportsSignLanguage: boolean
    textChatOnly: boolean
    barrierFreeSupport: boolean
    mediaUrls: string[]
    availabilityDays: string[]
    availabilityNote: string | null
  }
) {
  const payload = {
    title: input.title,
    description: input.description,
    provider_name: input.providerName,
    user_id: user.id,
    city: input.city,
    district: input.district,
    provider_bio: input.providerBio,
    years_experience: input.yearsExperience,
    service_radius_km: input.serviceRadiusKm,
    approx_lat: input.approxLat,
    approx_lng: input.approxLng,
    is_volunteer: input.isVolunteer,
    supports_sign_language: input.supportsSignLanguage,
    text_chat_only: input.textChatOnly,
    barrier_free_support: input.barrierFreeSupport,
    media_urls: input.mediaUrls,
    availability_days: input.availabilityDays,
    availability_note: input.availabilityNote,
  }

  let insert = await supabase.from("services").insert([payload]).select("*").single()
  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase
      .from("services")
      .insert([
        {
          title: input.title,
          description: input.description,
          provider_name: input.providerName,
          user_id: user.id,
        },
      ])
      .select("*")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Service konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data }
}

export async function submitProviderVerification(
  supabase: SupabasePublicClient,
  user: User,
  input: {
    companyName: string
    contactEmail: string | null
    city: string
    website: string | null
    proofUrls: string[]
    consentVersion: string | null
  }
) {
  let insert = await supabase
    .from("provider_verification_requests")
    .insert([
      {
        user_id: user.id,
        company_name: input.companyName,
        contact_email: input.contactEmail ?? user.email ?? null,
        city: input.city,
        website: input.website,
        proof_urls: input.proofUrls,
        status: "pending",
        privacy_accepted_at: new Date().toISOString(),
        verification_disclaimer_accepted_at: new Date().toISOString(),
        consent_version: input.consentVersion ?? LEGAL_CONSENT_VERSION,
      },
    ])
    .select("*")
    .single()

  if (insert.error && isMissingSchemaError(insert.error.message)) {
    insert = await supabase
      .from("provider_verification_requests")
      .insert([
        {
          user_id: user.id,
          company_name: input.companyName,
          contact_email: input.contactEmail ?? user.email ?? null,
          city: input.city,
          website: input.website,
          proof_urls: input.proofUrls,
          status: "pending",
        },
      ])
      .select("*")
      .single()
  }

  if (insert.error) {
    return { ok: false as const, status: 500, message: "Verifizierungsanfrage konnte nicht gespeichert werden." }
  }

  return { ok: true as const, data: insert.data }
}
