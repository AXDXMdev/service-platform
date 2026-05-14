import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dienstleistungen",
  description:
    "Finde verifizierte Anbieter in deiner Nähe. Suche nach Kategorien, Standort und passenden Leistungen.",
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
