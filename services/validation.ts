import {
  isValidEmail,
  normalizeText,
  toValidHttpUrls,
} from "@/lib/validation"
import { PILOT_MODE_ENABLED, isPilotCity } from "@/lib/pilotMode"
import type { RequestStatus } from "@/services/requestRules"

export const AVAILABILITY_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const
const MAX_MEDIA_URLS = 6
const ALLOWED_WAITLIST_ROLES = new Set(["customer", "provider", "volunteer"])

function invalid(message: string) {
  return { ok: false as const, message }
}

export function isMissingSchemaError(message: string | undefined) {
  return /column|schema|relation|table|request_events|deleted_at|updated_at|finalized_at/i.test(
    message ?? ""
  )
}

export function validateRequestCreateInput(input: unknown) {
  const payload = (input ?? {}) as {
    serviceId?: string
    customerBudgetEur?: number | string | null
  }

  const serviceId = normalizeText(payload.serviceId ?? "", 80)
  if (!serviceId) return invalid("Service fehlt.")

  let customerBudgetEur: number | null = null
  if (payload.customerBudgetEur !== undefined && payload.customerBudgetEur !== null && payload.customerBudgetEur !== "") {
    const amount = Number(String(payload.customerBudgetEur).replace(",", "."))
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return invalid("Bitte ein gueltiges Kundenbudget eingeben.")
    }
    customerBudgetEur = Number(amount.toFixed(2))
  }

  return {
    ok: true as const,
    value: {
      serviceId,
      customerBudgetEur,
    },
  }
}

export function validateRequestStatusInput(input: unknown) {
  const payload = (input ?? {}) as { nextStatus?: string; note?: string | null }
  const nextStatus = normalizeText(payload.nextStatus ?? "", 40)
  const allowed = new Set(["accepted", "rejected", "completed", "cancelled", "deleted"])
  if (!allowed.has(nextStatus)) {
    return invalid("Ungueltiger Zielstatus.")
  }

  return {
    ok: true as const,
    value: {
      nextStatus: nextStatus as RequestStatus,
      note: normalizeText(payload.note ?? "", 500) || null,
    },
  }
}

export function validateProviderOfferInput(input: unknown) {
  const payload = (input ?? {}) as { providerOfferEur?: number | string | null }
  const amount = Number(String(payload.providerOfferEur ?? "").replace(",", "."))
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return invalid("Bitte ein gueltiges Preisangebot eingeben.")
  }

  return {
    ok: true as const,
    value: {
      providerOfferEur: Number(amount.toFixed(2)),
    },
  }
}

export function validateFavoriteInput(input: unknown) {
  const payload = (input ?? {}) as { serviceId?: string }
  const serviceId = normalizeText(payload.serviceId ?? "", 80)
  if (!serviceId) return invalid("Service fehlt.")

  return {
    ok: true as const,
    value: {
      serviceId,
    },
  }
}

export function validateChatMessageInput(input: unknown) {
  const payload = (input ?? {}) as { requestId?: string; message?: string }
  const requestId = normalizeText(payload.requestId ?? "", 80)
  const message = normalizeText(payload.message ?? "", 1500)

  if (!requestId) return invalid("Anfrage fehlt.")
  if (!message) return invalid("Nachricht darf nicht leer sein.")

  return {
    ok: true as const,
    value: {
      requestId,
      message,
    },
  }
}

export function validateProviderVerificationInput(input: unknown, fallbackEmail?: string | null) {
  const payload = (input ?? {}) as {
    companyName?: string
    contactEmail?: string | null
    city?: string
    website?: string | null
    proofLinks?: string
    privacyAccepted?: boolean
    verificationDisclaimerAccepted?: boolean
    consentVersion?: string
  }

  const companyName = normalizeText(payload.companyName ?? "", 120)
  const city = normalizeText(payload.city ?? "", 80)
  const website = normalizeText(payload.website ?? "", 250) || null
  const proofs = toValidHttpUrls(payload.proofLinks ?? "")
  const contactEmail = normalizeText(payload.contactEmail ?? "", 200).toLowerCase() || fallbackEmail || null

  if (!companyName || !city || proofs.length === 0) {
    return invalid("Bitte Name, Stadt und mindestens einen gueltigen Nachweis-Link ausfuellen.")
  }
  if (contactEmail && !isValidEmail(contactEmail)) {
    return invalid("Bitte eine gueltige Kontakt-E-Mail eingeben.")
  }
  if (!payload.privacyAccepted || !payload.verificationDisclaimerAccepted) {
    return invalid("Bitte Datenschutz- und Verifizierungshinweise bestaetigen.")
  }

  return {
    ok: true as const,
    value: {
      companyName,
      contactEmail,
      city,
      website,
      proofUrls: proofs,
      consentVersion: normalizeText(payload.consentVersion ?? "", 40) || null,
    },
  }
}

export function validateWaitlistInput(input: unknown) {
  const payload = (input ?? {}) as {
    name?: string
    email?: string
    city?: string
    role?: string
    note?: string
    privacyAccepted?: boolean
    marketingAccepted?: boolean
  }

  const name = normalizeText(payload.name ?? "", 120)
  const email = normalizeText(payload.email ?? "", 200).toLowerCase()
  const city = normalizeText(payload.city ?? "", 80)
  const role = normalizeText(payload.role ?? "", 40)
  const note = normalizeText(payload.note ?? "", 800) || null

  if (!name || !email || !city) {
    return invalid("Bitte Name, E-Mail und Stadt ausfuellen.")
  }
  if (!isValidEmail(email)) {
    return invalid("Bitte eine gueltige E-Mail eingeben.")
  }
  if (!ALLOWED_WAITLIST_ROLES.has(role)) {
    return invalid("Bitte eine gueltige Rolle fuer die Warteliste waehlen.")
  }
  if (!payload.privacyAccepted) {
    return invalid("Bitte den Datenschutzhinweis bestaetigen.")
  }

  return {
    ok: true as const,
    value: {
      fullName: name,
      email,
      city,
      role: role as "customer" | "provider" | "volunteer",
      note,
      marketingAccepted: Boolean(payload.marketingAccepted),
    },
  }
}

export function validateReviewCreateInput(input: unknown) {
  const payload = (input ?? {}) as {
    requestId?: string
    serviceId?: string
    rating?: number | string
    comment?: string
    proofLinks?: string[] | string
  }

  const requestId = normalizeText(payload.requestId ?? "", 80)
  const serviceId = normalizeText(payload.serviceId ?? "", 80)
  const rating = Number(payload.rating)
  const comment = normalizeText(payload.comment ?? "", 1500) || null
  const proofUrls = Array.isArray(payload.proofLinks)
    ? payload.proofLinks
        .map((item) => normalizeText(item, 500))
        .filter((item) => /^https?:\/\//i.test(item))
    : toValidHttpUrls(payload.proofLinks ?? "")

  if (!requestId || !serviceId) {
    return invalid("Anfrage oder Service fehlt.")
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return invalid("Bitte eine Bewertung zwischen 1 und 5 Sternen angeben.")
  }
  if (proofUrls.length === 0) {
    return invalid("Bitte mindestens einen gueltigen Foto-Link als Beweis angeben.")
  }

  return {
    ok: true as const,
    value: {
      requestId,
      serviceId,
      rating,
      comment,
      proofUrls,
    },
  }
}

export function validateServiceCreateInput(input: unknown) {
  const payload = (input ?? {}) as {
    title?: string
    description?: string
    providerName?: string
    providerBio?: string
    city?: string
    district?: string
    yearsExperience?: number | string | null
    serviceRadiusKm?: number | string | null
    approxLat?: number | null
    approxLng?: number | null
    isVolunteer?: boolean
    supportsSignLanguage?: boolean
    textChatOnly?: boolean
    barrierFreeSupport?: boolean
    mediaUrls?: string[]
    availabilityDays?: string[]
    availabilityNote?: string
  }

  const title = normalizeText(payload.title ?? "", 120)
  const description = normalizeText(payload.description ?? "", 2000)
  const providerName = normalizeText(payload.providerName ?? "", 100)
  const city = normalizeText(payload.city ?? "", 80)
  const district = normalizeText(payload.district ?? "", 80) || null
  const providerBio = normalizeText(payload.providerBio ?? "", 1000) || null
  const availabilityNote = normalizeText(payload.availabilityNote ?? "", 200) || null
  const mediaUrls = (payload.mediaUrls ?? [])
    .map((url) => normalizeText(url, 500))
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, MAX_MEDIA_URLS)
  const availabilityDays = (payload.availabilityDays ?? []).filter((day): day is string =>
    AVAILABILITY_DAYS.includes(day as (typeof AVAILABILITY_DAYS)[number])
  )

  if (!title || !description || !providerName || !city) {
    return invalid("Bitte Titel, Beschreibung, Anbietername und Stadt ausfuellen.")
  }
  if (PILOT_MODE_ENABLED && !isPilotCity(city)) {
    return {
      ok: false as const,
      message: "pilot_only",
    }
  }

  const yearsExperience =
    payload.yearsExperience === null || payload.yearsExperience === undefined || payload.yearsExperience === ""
      ? null
      : Math.min(Math.max(Number(payload.yearsExperience) || 0, 0), 80)
  const serviceRadiusKm =
    payload.serviceRadiusKm === null || payload.serviceRadiusKm === undefined || payload.serviceRadiusKm === ""
      ? null
      : Math.min(Math.max(Number(payload.serviceRadiusKm) || 0, 0), 250)

  return {
    ok: true as const,
    value: {
      title,
      description,
      providerName,
      providerBio,
      city,
      district,
      yearsExperience,
      serviceRadiusKm,
      approxLat: typeof payload.approxLat === "number" ? payload.approxLat : null,
      approxLng: typeof payload.approxLng === "number" ? payload.approxLng : null,
      isVolunteer: Boolean(payload.isVolunteer),
      supportsSignLanguage: Boolean(payload.supportsSignLanguage),
      textChatOnly: Boolean(payload.textChatOnly),
      barrierFreeSupport: Boolean(payload.barrierFreeSupport),
      mediaUrls,
      availabilityDays,
      availabilityNote,
    },
  }
}
