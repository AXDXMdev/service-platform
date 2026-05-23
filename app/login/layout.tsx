import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Login",
  description:
    "Melde dich bei Hilfinio an, um Anfragen zu verwalten, Services anzubieten oder Anbieter zu kontaktieren.",
  path: "/login",
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
