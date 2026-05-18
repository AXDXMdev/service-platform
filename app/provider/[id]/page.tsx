"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { Service } from "@/app/types"
import { useLanguage } from "@/components/LanguageProvider"
import { getCached, setCached } from "@/lib/clientCache"
import { getProviderProfileData } from "@/lib/publicCatalogApi"
import EmptyState from "@/components/EmptyState"
import MarketplaceTrustBar from "@/components/MarketplaceTrustBar"
import ProviderAvatar from "@/components/service-detail/ProviderAvatar"
import ConversionSignalGrid from "@/components/service-detail/ConversionSignalGrid"

function isVideoMedia(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)
}

export default function ProviderProfile() {
  const { t } = useLanguage()
  const params = useParams()
  const id = String(params.id)

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const providerName =
    services.find((service) => service.provider_name)?.provider_name ?? "Hilfinio Anbieter"
  const profileImage =
    services.find((service) => service.provider_avatar_url)?.provider_avatar_url ?? null
  const representativeService = services[0] ?? null
  const verifiedServiceCount = services.filter((service) => service.is_verified).length
  const completedJobs = useMemo(
    () =>
      services.reduce((sum, service) => sum + (service.completed_jobs_count ?? 0), 0),
    [services]
  )

  useEffect(() => {
    async function loadServices() {
      const cacheKey = `hilfino:provider:${id}`
      const cached = getCached<Service[]>(cacheKey)
      if (cached) {
        setServices(cached)
        setLoading(false)
        return
      }

      try {
        const data = await getProviderProfileData(id)
        setServices(data.services)
        setCached(cacheKey, data.services, 45_000)
      } finally {
        setLoading(false)
      }
    }

    void loadServices()
  }, [id])

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <ProviderAvatar name={providerName} imageUrl={profileImage} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  Anbieterprofil
                </p>
                <h1 className="mt-2 break-words text-3xl font-semibold">{providerName}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {t("providerProfileSubtitle")}
                </p>
              </div>
            </div>
            <Link
              href={services[0] ? `/service/${services[0].id}#anfrage` : "/services"}
              className="btn-primary min-h-12 justify-center rounded-[10px] px-5 py-3 text-sm font-semibold text-white"
            >
              Anfrage starten
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="panel-muted rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Aktive Services
              </p>
              <p className="mt-1 text-2xl font-semibold">{services.length}</p>
            </div>
            <div className="panel-muted rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Verifizierung
              </p>
              <p className="mt-1 font-semibold">
                {verifiedServiceCount > 0 ? `${verifiedServiceCount} sichtbar` : "Ausstehend"}
              </p>
            </div>
            <div className="panel-muted rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Anfrageweg
              </p>
              <p className="mt-1 font-semibold">
                {completedJobs > 0 ? `${completedJobs} abgeschlossen` : "Hilfinio Chat"}
              </p>
            </div>
          </div>
          {representativeService && (
            <div className="mt-5">
              <ConversionSignalGrid
                responseTimeMinutes={representativeService.response_time_minutes}
                responseRatePercent={representativeService.response_rate_percent}
                completedJobsCount={completedJobs || representativeService.completed_jobs_count}
                repeatCustomerRatePercent={representativeService.repeat_customer_rate_percent}
                lastActiveAt={representativeService.provider_last_active_at}
              />
            </div>
          )}
        </section>

        <MarketplaceTrustBar compact className="mt-6" />

        {loading && <div className="card-surface mt-6 h-32 animate-pulse rounded-[12px]" />}

        {!loading && services.length === 0 && (
          <EmptyState
            className="mt-6"
            title={t("providerProfileEmpty")}
            description="Dieses Profil hat aktuell keine oeffentlich sichtbaren Services. Schau in den Kategorien nach passenden Alternativen."
            primaryAction={{ href: "/services", label: t("allServices") }}
          />
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="card-surface interactive-card flex flex-col rounded-[12px] p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="break-words font-semibold">{service.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    service.is_verified
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {service.is_verified ? "Geprueft" : "Neu"}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {service.description || t("providerProfileDescriptionFallback")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {service.city && (
                  <span className="rounded-full bg-slate-500/10 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300">
                    {service.city}
                  </span>
                )}
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300">
                  {service.price_from_eur ? `ab ${service.price_from_eur} EUR` : "Preis auf Anfrage"}
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-300">
                  {service.completed_jobs_count ? `${service.completed_jobs_count} Jobs` : "Neue Leistung"}
                </span>
              </div>
              {(service.media_urls?.length ?? 0) > 0 && (
                <div className="mt-3">
                  {isVideoMedia(service.media_urls![0]) ? (
                    <video
                      src={service.media_urls![0]}
                      controls
                      preload="metadata"
                      className="h-40 w-full rounded-[10px] border border-slate-200 bg-black dark:border-slate-700"
                    />
                  ) : (
                    <Image
                      src={service.media_urls![0]}
                      alt={t("providerProfileMediaAlt")}
                      width={1200}
                      height={800}
                      className="h-40 w-full rounded-[10px] border border-slate-200 object-cover dark:border-slate-700"
                    />
                  )}
                </div>
              )}
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                <Link
                  href={`/service/${service.id}#anfrage`}
                  className="btn-primary min-h-11 justify-center rounded-[10px] px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Anfragen
                </Link>
                <Link
                  href={`/service/${service.id}`}
                  className="btn-secondary min-h-11 justify-center rounded-[10px] px-3 py-2 text-center text-sm font-semibold"
                >
                  Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
