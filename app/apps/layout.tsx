import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Hilfinio Apps",
  description:
    "Hilfinio funktioniert mobil im Browser und bereitet native iOS- und Android-Apps vor.",
  path: "/apps",
})

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return children
}
