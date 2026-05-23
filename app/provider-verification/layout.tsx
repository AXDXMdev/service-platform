import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Anbieter-Verifizierung",
  description:
    "So prüft Hilfinio Anbieterprofile, Nachweise und Vertrauenssignale für lokale Dienstleistungen.",
  path: "/provider-verification",
})

export default function ProviderVerificationLayout({ children }: { children: React.ReactNode }) {
  return children
}
