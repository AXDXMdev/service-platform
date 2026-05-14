import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Service erstellen",
  description:
    "Erstelle als Anbieter dein Service-Profil mit Verfügbarkeit, Standort, Nachweisen und Arbeitsbeispielen.",
}

export default function CreateServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
