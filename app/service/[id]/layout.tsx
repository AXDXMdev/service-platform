import type { Metadata } from "next"
import JsonLd from "@/components/JsonLd"
import { getPublicServiceSeoData } from "@/lib/publicSeoData"
import { buildDefaultMetadata, serviceDetailJsonLd } from "@/lib/seo"

type ServiceDetailLayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await getPublicServiceSeoData(id)
  if (!data?.service) {
    return buildDefaultMetadata({
      title: "Service-Details",
      description:
        "Sieh Anbieter-Details, Bewertungen, Verifizierungsstatus und sende eine direkte Anfrage.",
      path: `/service/${id}`,
    })
  }

  const service = data.service
  const location = [service.city, service.district].filter(Boolean).join(", ")
  const description =
    service.description ||
    `Lokale Dienstleistung${location ? ` in ${location}` : ""} auf Hilfinio mit Anbieterprofil, Anfrageflow und Vertrauenssignalen.`

  return buildDefaultMetadata({
    title: service.title,
    description: description.slice(0, 155),
    path: `/service/${service.id}`,
    image: service.media_urls?.[0],
  })
}

export default async function ServiceDetailLayout({
  children,
  params,
}: ServiceDetailLayoutProps) {
  const { id } = await params
  const data = await getPublicServiceSeoData(id)

  return (
    <>
      {data?.service && (
        <JsonLd
          data={serviceDetailJsonLd({
            service: data.service,
            ratingAverage: data.ratingAverage,
            ratingCount: data.ratingCount,
          })}
        />
      )}
      {children}
    </>
  )
}
