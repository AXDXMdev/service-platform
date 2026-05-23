import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Problem melden",
  description:
    "Melde rechtswidrige Inhalte, Betrug, Belästigung, technische Fehler oder Datenschutzprobleme an Hilfinio.",
  path: "/report",
})

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
