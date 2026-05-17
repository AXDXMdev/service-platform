import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hilfinio",
    short_name: "Hilfinio",
    description: "Lokale Hilfe und Dienstleistungen finden, anfragen und verwalten.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    lang: "de-DE",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/hilfino-mark.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/hilfino-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
