import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Service-Details",
  description:
    "Sieh Anbieter-Details, Bewertungen, Verifizierungsstatus und sende eine direkte Anfrage.",
}

export default function ServiceDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
