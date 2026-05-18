import type { Metadata } from "next"
import type { Service } from "@/app/types"
import JsonLd from "@/components/JsonLd"
import { getPublicProviderSeoData } from "@/lib/publicSeoData"
import { buildDefaultMetadata, providerProfileJsonLd } from "@/lib/seo"

type ProviderLayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

function resolveProviderName(services: Service[]) {
  return services.find((service) => service.provider_name)?.provider_name || "Hilfinio Anbieter"
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await getPublicProviderSeoData(id)
  const providerName = data ? resolveProviderName(data.services) : "Hilfinio Anbieter"
  const serviceNames = data?.services.slice(0, 3).map((service) => service.title).join(", ")

  return buildDefaultMetadata({
    title: `${providerName} Profil`,
    description: serviceNames
      ? `${providerName} auf Hilfinio: ${serviceNames}. Pruefe Leistungen, Vertrauen und sende sichere Anfragen.`
      : "Anbieterprofil auf Hilfinio mit Leistungen, Vertrauenssignalen und sicherem Anfrageweg.",
    path: `/provider/${id}`,
    image: data?.services.find((service) => service.media_urls?.[0])?.media_urls?.[0],
  })
}

export default async function ProviderLayout({ children, params }: ProviderLayoutProps) {
  const { id } = await params
  const data = await getPublicProviderSeoData(id)

  return (
    <>
      {data && (
        <JsonLd
          data={providerProfileJsonLd({
            providerId: id,
            providerName: resolveProviderName(data.services),
            services: data.services,
          })}
        />
      )}
      {children}
    </>
  )
}
