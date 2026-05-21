export const LEGAL_LAST_UPDATED = "21.05.2026"
export const LEGAL_CONSENT_VERSION = "2026-05-21"

export const LEGAL_PLACEHOLDERS = {
  operatorName: "{{OPERATOR_NAME}}",
  operatorAddress: "{{OPERATOR_ADDRESS}}",
  operatorEmail: "{{OPERATOR_EMAIL}}",
  hostingProvider: "{{HOSTING_PROVIDER}}",
  vsbgStatus: "{{VSBG_STATUS}}",
} as const

export const LEGAL_OPERATOR = {
  name: "Alaadin Adem",
  addressMultiline: ["Stubaier Straße 18", "70327 Stuttgart", "Deutschland"],
  email: "alaadinadem@icloud.com",
  phone: null as string | null,
  responsiblePersonMstv: null as string | null,
  vatId: null as string | null,
}

export function hasOperatorAddress() {
  return !LEGAL_OPERATOR.addressMultiline.includes(LEGAL_PLACEHOLDERS.operatorAddress)
}

export const LEGAL_HOSTING_PROVIDER: string =
  "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA"
export const LEGAL_VSBG_STATUS: string = "nicht bereit und nicht verpflichtet"

export function hasHostingProvider() {
  return LEGAL_HOSTING_PROVIDER !== LEGAL_PLACEHOLDERS.hostingProvider
}

export function hasVsbgStatus() {
  return LEGAL_VSBG_STATUS !== LEGAL_PLACEHOLDERS.vsbgStatus
}

export const LEGAL_NOTES = {
  missingPostalAddress:
    "TODO_LEGAL_REVIEW: Die vollständige ladungsfähige Anschrift muss vor Veröffentlichung juristisch gegengeprüft werden.",
  missingHostingProvider:
    "TODO_LEGAL_REVIEW: Der finale Hosting- und Auftragsverarbeitungsstatus muss juristisch gegengeprüft werden.",
  missingVsbgStatus:
    "TODO_LEGAL_REVIEW: Der Status zur Verbraucherstreitbeilegung muss juristisch bestätigt werden.",
  disputeResolution:
    `Hilfinio ist ${LEGAL_VSBG_STATUS}, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`,
  germanVersionAuthoritative:
    "Maßgeblich ist die deutsche Fassung dieser Rechtstexte.",
  odrDiscontinued:
    "Die frühere EU-Online-Streitbeilegungsplattform wurde zum 20.07.2025 eingestellt und wird daher nicht mehr verlinkt.",
  legalReview:
    "TODO_LEGAL_REVIEW: Diese Rechtstexte sind eine technische Plattformfassung und ersetzen keine anwaltliche Prüfung für den öffentlichen Launch.",
}
