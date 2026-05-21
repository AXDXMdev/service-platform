import { z } from "zod"
import { normalizeText, toValidHttpUrls } from "@/lib/validation"
import { PILOT_MODE_ENABLED, isPilotCity } from "@/lib/pilotMode"
import type { RequestStatus } from "@/services/requestRules"

export const AVAILABILITY_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const
const MAX_MEDIA_URLS = 6
const ALLOWED_WAITLIST_ROLES = new Set(["customer", "provider", "volunteer"])
const allowedRequestStatuses = ["accepted", "declined", "rejected", "completed", "cancelled", "deleted"] as const

const textField = (maxLength: number) =>
  z.preprocess((value) => normalizeText(typeof value === "string" ? value : "", maxLength), z.string())

const optionalTextField = (maxLength: number) =>
  z.preprocess(
    (value) => normalizeText(typeof value === "string" ? value : "", maxLength) || null,
    z.string().nullable()
  )

const moneyField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null
  return Number(String(value).replace(",", "."))
}, z.number().positive().max(100000).nullable())

const requiredMoneyField = z.preprocess(
  (value) => Number(String(value ?? "").replace(",", ".")),
  z.number().positive().max(100000)
)

const booleanField = z.preprocess((value) => Boolean(value), z.boolean())
const urlString = z.string().trim().url().refine((value) => /^https?:\/\//i.test(value))

function valid<T>(value: T) {
  return { ok: true as const, value }
}

function invalid(message: string) {
  return { ok: false as const, message }
}

export function isMissingSchemaError(message: string | undefined) {
  return /column|schema|relation|table|request_events|deleted_at|updated_at|finalized_at/i.test(
    message ?? ""
  )
}

export function validateRequestCreateInput(input: unknown) {
  const parsed = z
    .object({
      serviceId: textField(80).pipe(z.string().min(1)),
      message: textField(1500).pipe(z.string().min(10).max(1500)),
      customerBudgetEur: moneyField.optional().default(null),
      preferredDate: optionalTextField(120).optional().default(null),
      location: optionalTextField(160).optional().default(null),
      contactPreference: optionalTextField(80).optional().default(null),
    })
    .safeParse(input ?? {})

  if (!parsed.success) return invalid("Bitte Service und eine konkrete Nachricht mit mindestens 10 Zeichen angeben.")

  return valid({
    serviceId: parsed.data.serviceId,
    message: parsed.data.message,
    customerBudgetEur:
      parsed.data.customerBudgetEur === null ? null : Number(parsed.data.customerBudgetEur.toFixed(2)),
    preferredDate: parsed.data.preferredDate,
    location: parsed.data.location,
    contactPreference: parsed.data.contactPreference,
  })
}

export function validateRequestStatusInput(input: unknown) {
  const parsed = z
    .object({
      nextStatus: textField(40).pipe(z.enum(allowedRequestStatuses)),
      note: optionalTextField(500).optional().default(null),
    })
    .safeParse(input ?? {})

  if (!parsed.success) return invalid("Ungültiger Zielstatus.")

  return valid({
    nextStatus: parsed.data.nextStatus as RequestStatus,
    note: parsed.data.note,
  })
}

export function validateProviderOfferInput(input: unknown) {
  const parsed = z.object({ providerOfferEur: requiredMoneyField }).safeParse(input ?? {})
  if (!parsed.success) return invalid("Bitte ein gültiges Preisangebot eingeben.")

  return valid({ providerOfferEur: Number(parsed.data.providerOfferEur.toFixed(2)) })
}

export function validateFavoriteInput(input: unknown) {
  const parsed = z.object({ serviceId: textField(80).pipe(z.string().min(1)) }).safeParse(input ?? {})
  if (!parsed.success) return invalid("Service fehlt.")
  return valid({ serviceId: parsed.data.serviceId })
}

export function validateChatMessageInput(input: unknown) {
  const parsed = z
    .object({
      requestId: textField(80).pipe(z.string().min(1)),
      message: textField(1500).pipe(z.string().min(1)),
    })
    .safeParse(input ?? {})

  if (!parsed.success) return invalid("Anfrage fehlt oder Nachricht darf nicht leer sein.")
  return valid(parsed.data)
}

export function validateProviderVerificationInput(input: unknown, fallbackEmail?: string | null) {
  const parsed = z
    .object({
      companyName: textField(120).pipe(z.string().min(1)),
      contactEmail: optionalTextField(200).optional().default(null),
      city: textField(80).pipe(z.string().min(1)),
      website: optionalTextField(250).optional().default(null),
      proofLinks: textField(2000),
      privacyAccepted: z.literal(true),
      verificationDisclaimerAccepted: z.literal(true),
      consentVersion: optionalTextField(40).optional().default(null),
    })
    .safeParse(input ?? {})

  if (!parsed.success) {
    return invalid("Bitte Name, Stadt und mindestens einen gültigen Nachweis-Link ausfüllen.")
  }

  const proofs = toValidHttpUrls(parsed.data.proofLinks)
  if (proofs.length === 0) {
    return invalid("Bitte Name, Stadt und mindestens einen gültigen Nachweis-Link ausfüllen.")
  }

  const contactEmail = (parsed.data.contactEmail?.toLowerCase() || fallbackEmail || null)
  if (contactEmail && !z.string().email().safeParse(contactEmail).success) {
    return invalid("Bitte eine gültige Kontakt-E-Mail eingeben.")
  }

  return valid({
    companyName: parsed.data.companyName,
    contactEmail,
    city: parsed.data.city,
    website: parsed.data.website,
    proofUrls: proofs,
    consentVersion: parsed.data.consentVersion,
  })
}

export function validateWaitlistInput(input: unknown) {
  const parsed = z
    .object({
      name: textField(120).pipe(z.string().min(1)),
      email: textField(200).pipe(z.string().email()),
      city: textField(80).pipe(z.string().min(1)),
      role: textField(40).pipe(z.enum(["customer", "provider", "volunteer"])),
      note: optionalTextField(800).optional().default(null),
      privacyAccepted: z.literal(true),
      marketingAccepted: booleanField.optional().default(false),
    })
    .safeParse(input ?? {})

  if (!parsed.success) {
    return invalid("Bitte Name, E-Mail und Stadt ausfüllen.")
  }

  if (!ALLOWED_WAITLIST_ROLES.has(parsed.data.role)) {
    return invalid("Bitte eine gültige Rolle für die Warteliste wählen.")
  }

  return valid({
    fullName: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    city: parsed.data.city,
    role: parsed.data.role,
    note: parsed.data.note,
    marketingAccepted: parsed.data.marketingAccepted,
  })
}

export function validateReviewCreateInput(input: unknown) {
  const parsed = z
    .object({
      requestId: textField(80).pipe(z.string().min(1)),
      serviceId: textField(80).pipe(z.string().min(1)),
      rating: z.preprocess((value) => Number(value), z.number().int().min(1).max(5)),
      comment: optionalTextField(1500).optional().default(null),
      proofLinks: z.union([z.array(z.string()), z.string()]),
    })
    .safeParse(input ?? {})

  if (!parsed.success) {
    return invalid("Anfrage oder Service fehlt.")
  }

  const proofUrls = Array.isArray(parsed.data.proofLinks)
    ? parsed.data.proofLinks
        .map((item) => normalizeText(item, 500))
        .filter((item) => urlString.safeParse(item).success)
    : toValidHttpUrls(parsed.data.proofLinks)

  if (proofUrls.length === 0) {
    return invalid("Bitte mindestens einen gültigen Foto-Link als Beweis angeben.")
  }

  return valid({
    requestId: parsed.data.requestId,
    serviceId: parsed.data.serviceId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    proofUrls,
  })
}

export function validateServiceCreateInput(input: unknown) {
  const parsed = z
    .object({
      title: textField(120).pipe(z.string().min(1)),
      description: textField(2000).pipe(z.string().min(1)),
      providerName: textField(100).pipe(z.string().min(1)),
      providerBio: optionalTextField(1000).optional().default(null),
      city: textField(80).pipe(z.string().min(1)),
      district: optionalTextField(80).optional().default(null),
      yearsExperience: z
        .preprocess((value) => {
          if (value === null || value === undefined || value === "") return null
          return Number(value)
        }, z.number().min(0).max(80).nullable())
        .optional()
        .default(null),
      serviceRadiusKm: z
        .preprocess((value) => {
          if (value === null || value === undefined || value === "") return null
          return Number(value)
        }, z.number().min(0).max(250).nullable())
        .optional()
        .default(null),
      approxLat: z.number().min(-90).max(90).nullable().optional().default(null),
      approxLng: z.number().min(-180).max(180).nullable().optional().default(null),
      isVolunteer: booleanField.optional().default(false),
      supportsSignLanguage: booleanField.optional().default(false),
      textChatOnly: booleanField.optional().default(false),
      barrierFreeSupport: booleanField.optional().default(false),
      mediaUrls: z.array(z.string()).optional().default([]),
      availabilityDays: z.array(z.string()).optional().default([]),
      availabilityNote: optionalTextField(200).optional().default(null),
    })
    .safeParse(input ?? {})

  if (!parsed.success) {
    return invalid("Bitte Titel, Beschreibung, Anbietername und Stadt ausfüllen.")
  }

  const mediaUrls = parsed.data.mediaUrls
    .map((url) => normalizeText(url, 500))
    .filter((url) => urlString.safeParse(url).success)
    .slice(0, MAX_MEDIA_URLS)
  const availabilityDays = parsed.data.availabilityDays.filter((day): day is string =>
    AVAILABILITY_DAYS.includes(day as (typeof AVAILABILITY_DAYS)[number])
  )

  if (PILOT_MODE_ENABLED && !isPilotCity(parsed.data.city)) {
    return {
      ok: false as const,
      message: "pilot_only",
    }
  }

  return valid({
    title: parsed.data.title,
    description: parsed.data.description,
    providerName: parsed.data.providerName,
    providerBio: parsed.data.providerBio,
    city: parsed.data.city,
    district: parsed.data.district,
    yearsExperience: parsed.data.yearsExperience,
    serviceRadiusKm: parsed.data.serviceRadiusKm,
    approxLat: parsed.data.approxLat,
    approxLng: parsed.data.approxLng,
    isVolunteer: parsed.data.isVolunteer,
    supportsSignLanguage: parsed.data.supportsSignLanguage,
    textChatOnly: parsed.data.textChatOnly,
    barrierFreeSupport: parsed.data.barrierFreeSupport,
    mediaUrls,
    availabilityDays,
    availabilityNote: parsed.data.availabilityNote,
  })
}
