import type {
  AppSettings,
  Category,
  CustomerProfile,
  LegalDocument,
  Provider,
  RequestSummary,
  SupportChannel,
} from "../types"

// MOCK DATA: Replace with Hilfinio API or Supabase-backed reads before production.
export const categories: Category[] = [
  { id: "cleaning", label: "Reinigung", icon: "sparkle" },
  { id: "moving", label: "Umzug", icon: "box" },
  { id: "garden", label: "Garten", icon: "leaf" },
  { id: "repair", label: "Reparatur", icon: "tool" },
  { id: "care", label: "Alltagshilfe", icon: "heart" },
  { id: "digital", label: "Digitalhilfe", icon: "phone" },
]

export const providers: Provider[] = [
  {
    id: "p1",
    name: "Mira Service Team",
    categoryId: "cleaning",
    title: "Haushaltsreinigung und Fensterpflege",
    city: "Berlin",
    district: "Prenzlauer Berg",
    rating: 4.9,
    reviewCount: 38,
    priceFrom: 39,
    verified: true,
    availability: "Mo-Fr ab 16:00",
    description:
      "Verlaessliche Reinigung fuer Wohnungen, Bueros und Treppenhaeuser mit klarer Absprache vor Ort.",
    tags: ["Verifiziert", "Kurzfristig", "Versichert"],
    bio: "Kleines Berliner Team mit Fokus auf saubere Uebergaben, freundliche Kommunikation und feste Zeitfenster.",
    responseTime: "Antwortet meist in unter 2 Stunden",
    serviceArea: "Berlin Mitte, Prenzlauer Berg, Pankow",
    languages: ["Deutsch", "Englisch"],
    completedJobs: 182,
  },
  {
    id: "p2",
    name: "Nord Umzugshilfe",
    categoryId: "moving",
    title: "Umzugshilfe mit Transporter",
    city: "Hamburg",
    district: "Altona",
    rating: 4.8,
    reviewCount: 24,
    priceFrom: 55,
    verified: true,
    availability: "Sa-So ganztags",
    description:
      "Zwei Helfer, Transporter und Verpackungstipps fuer kleine und mittlere Umzuege.",
    tags: ["Transporter", "Wochenende", "Puenktlich"],
    bio: "Erfahrenes Umzugsteam fuer schnelle Wohnungswechsel, Kleintransporte und saubere Terminabstimmung.",
    responseTime: "Antwortet meist am selben Tag",
    serviceArea: "Hamburg Altona, Eimsbuettel, Ottensen",
    languages: ["Deutsch", "Tuerkisch"],
    completedJobs: 96,
  },
  {
    id: "p3",
    name: "CarePlus Nachbarschaft",
    categoryId: "care",
    title: "Einkaufen und Begleitung im Alltag",
    city: "Stuttgart",
    district: "West",
    rating: 4.7,
    reviewCount: 19,
    priceFrom: 22,
    verified: false,
    availability: "Nach Vereinbarung",
    description:
      "Freundliche Alltagshilfe fuer Einkaeufe, Begleitung zu Terminen und leichte Erledigungen.",
    tags: ["Barrierearm", "Text-Chat", "Geduldig"],
    bio: "Alltagsnahe Unterstuetzung mit viel Geduld, klarer Kommunikation und Fokus auf Vertrauen.",
    responseTime: "Antwortet innerhalb von 24 Stunden",
    serviceArea: "Stuttgart West, Mitte und Feuerbach",
    languages: ["Deutsch"],
    completedJobs: 54,
  },
]

export const customerProfile: CustomerProfile = {
  id: "u-demo-1",
  name: "Alaadin Demo",
  email: "demo@hilfinio.de",
  city: "Koeln",
  favoritesCount: 3,
  requestCount: 4,
  verifiedPhone: false,
}

export const bookingHistory: RequestSummary[] = [
  {
    id: "r1",
    providerName: "Mira Service Team",
    serviceTitle: "Fensterpflege",
    status: "pending",
    dateLabel: "18.05.2026",
  },
  {
    id: "r2",
    providerName: "Nord Umzugshilfe",
    serviceTitle: "Umzugshilfe",
    status: "accepted",
    dateLabel: "25.05.2026",
  },
]

export const supportChannels: SupportChannel[] = [
  {
    id: "mail",
    label: "Support per E-Mail",
    description: "Fuer Fragen zu Buchungen, Konten und Verifizierungen.",
    value: "support@hilfinio.de",
    availability: "Mo-Fr, 09:00-18:00",
  },
  {
    id: "safety",
    label: "Sicherheitsanliegen",
    description: "Fuer dringende Meldungen zu Missbrauch oder problematischen Anfragen.",
    value: "safety@hilfinio.de",
    availability: "Priorisiert innerhalb von 24 Stunden",
  },
]

export const legalDocuments: LegalDocument[] = [
  {
    id: "datenschutz",
    title: "Datenschutz",
    summary: "Platzhalter fuer die mobile Datenschutzansicht.",
    body: [
      "Dieses Dokument ist aktuell ein Platzhalter fuer die spaetere, rechtlich finalisierte Datenschutzerklaerung.",
      "Vor TestFlight und App-Store-Release muessen die finalen Texte aus der Website oder einem zentralen CMS uebernommen werden.",
    ],
  },
  {
    id: "impressum",
    title: "Impressum",
    summary: "Platzhalter fuer Anbieterkennzeichnung und Kontaktdaten.",
    body: [
      "Das mobile Impressum ist noch nicht final. Gesellschaftsdaten, Kontaktinformationen und Vertretungsangaben muessen vor Release abgestimmt werden.",
      "Die mobile App sollte spaeter dieselbe Rechtsgrundlage wie die Website ausliefern.",
    ],
  },
  {
    id: "agb",
    title: "AGB",
    summary: "Platzhalter fuer die spaetere mobile Darstellung der AGB.",
    body: [
      "Die AGB liegen fuer die App noch nicht in finaler Form vor.",
      "Vor Beta-Test und App-Store-Einreichung sollte es eine zentrale Quelle fuer rechtliche Texte geben.",
    ],
  },
]

export const appSettings: AppSettings = {
  city: "Koeln",
  language: "DE",
  notificationsEnabled: false,
  supportEmail: "support@hilfinio.de",
  privacyVersion: "Entwurf 2026-05",
}
