import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Cookie- und Consent-Einstellungen",
  description:
    "Verwalte deine Einwilligungen für notwendige, Analytics- und Marketing-Technologien auf Hilfinio.",
  path: "/cookie-einstellungen",
})

export default function CookieSettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
