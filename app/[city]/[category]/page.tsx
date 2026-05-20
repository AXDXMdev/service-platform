import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { categoryBySlug } from "@/app/serviceCatalog"
import JsonLd from "@/components/JsonLd"
import {
  buildDefaultMetadata,
  serviceLandingJsonLd,
  seoCities,
} from "@/lib/seo"

export const dynamicParams = false

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function resolveLanding(city: string, category: string) {
  const normalizedCity = city.toLowerCase()
  const normalizedCategory = category.toLowerCase()
  const serviceCategory = categoryBySlug.get(normalizedCategory)

  if (!seoCities.includes(normalizedCity as (typeof seoCities)[number]) || !serviceCategory) {
    return null
  }

  const cityLabel = titleCase(normalizedCity)
  const categoryLabel = titleCase(normalizedCategory)
  return {
    city: cityLabel,
    category: categoryLabel,
    path: `/${normalizedCity}/${normalizedCategory}`,
    title: `${categoryLabel} in ${cityLabel} finden`,
    description: `Finde vertrauenswuerdige Anbieter für ${categoryLabel} in ${cityLabel}. Vergleiche Profile, Bewertungen, Verifizierung und stelle sichere Anfragen über Hilfinio.`,
  }
}

export function generateStaticParams() {
  return seoCities.flatMap((city) =>
    Array.from(categoryBySlug.keys()).map((category) => ({ city, category }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; category: string }>
}): Promise<Metadata> {
  const { city, category } = await params
  const landing = resolveLanding(city, category)
  if (!landing) return {}

  return buildDefaultMetadata({
    title: landing.title,
    description: landing.description,
    path: landing.path,
  })
}

export default async function LocalServiceLanding({
  params,
}: {
  params: Promise<{ city: string; category: string }>
}) {
  const { city, category } = await params
  const landing = resolveLanding(city, category)
  if (!landing) notFound()

  const searchHref = `/services?category=${encodeURIComponent(category)}&q=${encodeURIComponent(landing.city)}`

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <JsonLd data={serviceLandingJsonLd(landing)} />
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Lokale Services
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          {landing.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {landing.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={searchHref} className="btn-primary justify-center px-5 py-3 font-semibold">
            Anbieter ansehen
          </Link>
          <Link href="/provider-verification" className="btn-secondary justify-center px-5 py-3 font-semibold">
            Anbieter werden
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
        {[
          "Verifizierte Profile und klare Leistungsbeschreibungen",
          "Sichere Anfrage- und Kommunikationsprozesse",
          "Bewertungen, Nachweise und Missbrauchsmeldungen",
        ].map((item) => (
          <div key={item} className="panel-muted rounded-[12px] p-5 text-sm leading-6">
            {item}
          </div>
        ))}
      </section>
    </main>
  )
}
