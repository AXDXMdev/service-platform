import type { Metadata } from "next"
import { serviceCategories } from "@/app/serviceCatalog"

export const seoCities = ["stuttgart", "esslingen", "ludwigsburg", "fellbach", "waiblingen"] as const

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export function canonicalUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString()
}

export function buildDefaultMetadata(input: {
  title: string
  description: string
  path: string
  image?: string
}): Metadata {
  const url = canonicalUrl(input.path)
  const image = input.image ?? "/hilfinio-og.png"

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      languages: {
        "de-DE": url,
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "Hilfinio",
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      locale: "de_DE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hilfinio",
    url: canonicalUrl("/"),
    logo: canonicalUrl("/hilfino-logo.png"),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "alaadinadem@icloud.com",
      areaServed: "DE",
      availableLanguage: ["de"],
    },
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hilfinio",
    url: canonicalUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalUrl("/services")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function localMarketplaceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Hilfinio",
    url: canonicalUrl("/"),
    areaServed: seoCities.map((city) => ({
      "@type": "City",
      name: city.charAt(0).toUpperCase() + city.slice(1),
    })),
    makesOffer: serviceCategories.map((category) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: category.slug,
      },
    })),
  }
}

export function serviceLandingJsonLd(input: {
  city: string
  category: string
  title: string
  description: string
  path: string
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hilfinio", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "Services", item: canonicalUrl("/services") },
        { "@type": "ListItem", position: 3, name: input.title, item: canonicalUrl(input.path) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: input.title,
      description: input.description,
      areaServed: {
        "@type": "City",
        name: input.city,
      },
      provider: {
        "@type": "Organization",
        name: "Hilfinio",
        url: canonicalUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Wie finde ich ${input.category} in ${input.city}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nutze die Hilfinio-Suche, filtere nach Stadt, Kategorie, Vertrauen und Bewertungen und stelle eine konkrete Anfrage.",
          },
        },
        {
          "@type": "Question",
          name: "Wie schuetzt Hilfinio vor unserioesen Angeboten?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hilfinio kombiniert Anbieterprofile, Verifizierung, Bewertungen, Abuse-Meldungen und Moderationsprozesse.",
          },
        },
      ],
    },
  ]
}
