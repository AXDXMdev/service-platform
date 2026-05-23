import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Warteliste",
  description:
    "Trage dich für Hilfinio ein und erfahre, wann neue Städte, Kategorien oder Anbieter verfügbar sind.",
  path: "/waitlist",
})

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
