export type ThemeSettings = {
  key: string
  primary_color: string
  secondary_color: string
  background_color: string
  button_color: string
  text_color: string
  text_secondary_color: string
  text_muted_color: string
  card_background_color: string
  card_text_color: string
  border_radius: number
  text_logo: string | null
  logo_url: string | null
  hero_background_url: string | null
  card_style: string
}

export type SiteSettings = {
  key: string
  hero_title: string | null
  hero_subheadline: string | null
  hero_cta_find: string | null
  hero_cta_offer: string | null
  trust_badges: string[]
  pilot_cities: string[]
  notice_boxes: string[]
  default_theme_mode: "light" | "dark"
}

export type HomepageSection = {
  key: string
  label: string
  enabled: boolean
  sort_order: number
}

export type CmsCategory = {
  id: string
  slug: string
  name: string
  icon: string
  description: string
  color: string
  sort_order: number
  is_active: boolean
}

export type SiteContentRecord = {
  key: string
  content: Record<string, unknown>
}

export type PageContent = {
  id?: string
  slug: string
  title: string
  subtitle: string | null
  content: string | null
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  updated_at?: string
}

export const defaultThemeSettings: ThemeSettings = {
  key: "default",
  primary_color: "#5b4bff",
  secondary_color: "#4338ca",
  background_color: "#f7f9ff",
  button_color: "#5b4bff",
  text_color: "#0e1726",
  text_secondary_color: "#334155",
  text_muted_color: "#64748b",
  card_background_color: "#ffffff",
  card_text_color: "#0f172a",
  border_radius: 10,
  text_logo: "Hilfinio",
  logo_url: null,
  hero_background_url: null,
  card_style: "soft",
}

export const defaultSiteSettings: SiteSettings = {
  key: "default",
  hero_title: "Hilfinio - lokale Hilfe, die wirklich weiterhilft.",
  hero_subheadline:
    "Finde geprüfte Anbieter für Alltag, Zuhause und kleine Notfälle. Schnell, lokal und verständlich.",
  hero_cta_find: null,
  hero_cta_offer: null,
  trust_badges: [],
  pilot_cities: ["Berlin", "Hamburg", "München", "Stuttgart"],
  notice_boxes: [],
  default_theme_mode: "dark",
}

export const defaultPageContents: PageContent[] = [
  {
    slug: "home",
    title: "Hilfinio - lokale Hilfe, die wirklich weiterhilft.",
    subtitle: "Finde passende Hilfe schnell, lokal und transparent.",
    content: "Startseite mit Services, Vertrauenselementen und Pilotstädten.",
    meta_title: "Hilfinio - Lokale Dienstleister finden",
    meta_description: "Hilfinio verbindet Kunden und Anbieter für lokale Dienstleistungen.",
    is_active: true,
  },
  {
    slug: "services",
    title: "Dienstleistungen",
    subtitle: "Suche, filtere und vergleiche Anbieter in deiner Nähe.",
    content: "Service-Übersicht mit Kategorie-, Standort- und Sortierfiltern.",
    meta_title: "Dienstleistungen auf Hilfinio",
    meta_description: "Finde Reinigung, Reparatur, Umzug, Nachhilfe, IT-Hilfe und mehr.",
    is_active: true,
  },
  {
    slug: "impressum",
    title: "Impressum",
    subtitle: "Rechtliche Angaben zum Betreiber von Hilfinio.",
    content: "Bitte reale Betreiberangaben vor dem Go-Live eintragen.",
    meta_title: "Impressum - Hilfinio",
    meta_description: "Impressum und Kontaktangaben von Hilfinio.",
    is_active: true,
  },
  {
    slug: "datenschutz",
    title: "Datenschutzerklärung (DSGVO)",
    subtitle: "Informationen zur Verarbeitung personenbezogener Daten.",
    content: "Diese Inhalte müssen vor dem Go-Live rechtlich final geprüft werden.",
    meta_title: "Datenschutz - Hilfinio",
    meta_description: "Datenschutzhinweise und DSGVO-Informationen für Hilfinio.",
    is_active: true,
  },
  {
    slug: "agb",
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    subtitle: "Regeln für Kunden, Anbieter und die Nutzung der Plattform.",
    content: "Diese Vorlage ersetzt keine rechtliche Beratung.",
    meta_title: "AGB - Hilfinio",
    meta_description: "Allgemeine Geschäftsbedingungen für Hilfinio.",
    is_active: true,
  },
  {
    slug: "waitlist",
    title: "Warteliste",
    subtitle: "Trage dich für den Pilotbetrieb in deiner Stadt ein.",
    content: "Wartelisten-Einträge helfen beim strukturierten Stadtstart.",
    meta_title: "Warteliste - Hilfinio",
    meta_description: "Trage dich in die Hilfinio Warteliste ein.",
    is_active: true,
  },
  {
    slug: "provider-verification",
    title: "Anbieter-Verifizierung",
    subtitle: "Reiche Nachweise ein, damit dein Anbieterprofil verifiziert werden kann.",
    content: "Verifizierung stärkt Vertrauen und Sichtbarkeit auf Hilfinio.",
    meta_title: "Anbieter-Verifizierung - Hilfinio",
    meta_description: "Anbieter können bei Hilfinio Nachweise zur Verifizierung einreichen.",
    is_active: true,
  },
]
