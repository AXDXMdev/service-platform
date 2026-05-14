export const CONSENT_STORAGE_KEY = "hilfinio-consent-v1"

export type ConsentSettings = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

export function defaultConsentSettings(): ConsentSettings {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  }
}

export function readConsentSettings(): ConsentSettings | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentSettings>
    if (
      parsed.necessary !== true ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null
    }
    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

export function writeConsentSettings(settings: Omit<ConsentSettings, "updatedAt"> & { updatedAt?: string }) {
  if (typeof window === "undefined") return

  const payload: ConsentSettings = {
    necessary: true,
    analytics: settings.analytics,
    marketing: settings.marketing,
    updatedAt: settings.updatedAt ?? new Date().toISOString(),
  }

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event("hilfinio-consent-changed"))
}
