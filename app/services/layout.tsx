import type { Metadata } from "next"
import JsonLd from "@/components/JsonLd"
import { buildDefaultMetadata, servicesMarketplaceJsonLd } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Dienstleistungen in Stuttgart und Esslingen finden",
  description:
    "Finde lokale Dienstleister auf Hilfinio. Suche nach Kategorien, Standort, Verifizierung, Bewertungen und stelle sichere Anfragen.",
  path: "/services",
})

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={servicesMarketplaceJsonLd()} />
      {children}
    </>
  )
}
