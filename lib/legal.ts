export const LEGAL_LAST_UPDATED = "06.05.2026"
export const LEGAL_CONSENT_VERSION = "2026-05-06"

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
    "Vor dem Livegang muss eine vollstaendige ladungsfaehige Anschrift (Strasse, Hausnummer, Postleitzahl) ergaenzt werden.",
  missingHostingProvider:
    "Vor dem Livegang muss der finale Hosting-Anbieter mit Sitz, DPA-Lage und technischer Rolle in der Datenschutzerklaerung eingetragen werden.",
  missingVsbgStatus:
    "Vor dem Livegang muss entschieden und eingetragen werden, ob Hilfinio bereit oder verpflichtet ist, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
  disputeResolution:
    `Hilfinio ist ${LEGAL_VSBG_STATUS} an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`,
  germanVersionAuthoritative:
    "Massgeblich ist die deutsche Fassung dieser Rechtstexte.",
  odrDiscontinued:
    "Die fruehere EU-Online-Streitbeilegungsplattform wurde zum 20.07.2025 eingestellt und wird daher nicht mehr verlinkt.",
}
