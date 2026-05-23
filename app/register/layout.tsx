import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Registrieren",
  description:
    "Erstelle dein Hilfinio-Konto, um lokale Dienstleistungen anzufragen oder eigene Services anzubieten.",
  path: "/register",
})

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
