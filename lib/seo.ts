import type { Metadata } from "next"
import { serviceCategories } from "@/app/serviceCatalog"
import type { Service } from "@/app/types"

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

export function servicesMarketplaceJsonLd() {
  const servicesUrl = canonicalUrl("/services")

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hilfinio", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "Dienstleistungen", item: servicesUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Dienstleistungen auf Hilfinio",
      description:
        "Finde lokale Dienstleister in Stuttgart, Esslingen und Umgebung. Vergleiche Kategorien, Anbieterprofile, Verifizierung und stelle sichere Anfragen.",
      url: servicesUrl,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: serviceCategories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: canonicalUrl(`/services?category=${category.slug}`),
          name: category.slug,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Wie finde ich passende Dienstleister auf Hilfinio?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nutze Suche, Kategorie-Filter und Standortfilter. Vergleiche Profile, Verifizierung, Bewertungen und Leistungsbeschreibungen.",
          },
        },
        {
          "@type": "Question",
          name: "Wie kann ich Anbieter auf Hilfinio sicher anfragen?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Öffne ein Serviceprofil, prüfe Anbieterinformationen und sende eine Anfrage über den Hilfinio-Anfrageflow.",
          },
        },
      ],
    },
  ]
}

export function serviceDetailJsonLd(input: {
  service: Service
  ratingAverage?: number | null
  ratingCount?: number
}) {
  const { service, ratingAverage = null, ratingCount = 0 } = input
  const path = `/service/${service.id}`
  const locationLabel = [service.city, service.district].filter(Boolean).join(", ")
  const serviceNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description || `Lokale Dienstleistung auf Hilfinio${locationLabel ? ` in ${locationLabel}` : ""}.`,
    url: canonicalUrl(path),
    areaServed: service.city
      ? {
          "@type": "City",
          name: service.city,
        }
      : "Deutschland",
    provider: {
      "@type": service.provider_name ? "Person" : "Organization",
      name: service.provider_name || "Hilfinio Anbieter",
      url: service.user_id ? canonicalUrl(`/provider/${service.user_id}`) : canonicalUrl(path),
    },
  }

  if (service.price_from_eur) {
    serviceNode.offers = {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: service.price_from_eur,
      availability: "https://schema.org/InStock",
      url: canonicalUrl(`${path}#anfrage`),
    }
  }

  if (ratingAverage != null && ratingCount > 0) {
    serviceNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingAverage,
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (service.media_urls?.[0]) {
    serviceNode.image = service.media_urls[0]
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hilfinio", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "Dienstleistungen", item: canonicalUrl("/services") },
        { "@type": "ListItem", position: 3, name: service.title, item: canonicalUrl(path) },
      ],
    },
    serviceNode,
  ]
}

export function providerProfileJsonLd(input: {
  providerId: string
  providerName: string
  services: Service[]
}) {
  const path = `/provider/${input.providerId}`

  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${input.providerName} auf Hilfinio`,
      url: canonicalUrl(path),
      mainEntity: {
        "@type": "Person",
        name: input.providerName,
        url: canonicalUrl(path),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Services von ${input.providerName}`,
      itemListElement: input.services.slice(0, 12).map((service, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonicalUrl(`/service/${service.id}`),
        name: service.title,
      })),
    },
  ]
}
