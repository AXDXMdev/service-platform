"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import type { Service } from "@/app/types"
import { useLanguage } from "@/components/LanguageProvider"
import { getCached, setCached } from "@/lib/clientCache"
import { getProviderProfileData } from "@/lib/publicCatalogApi"

function isVideoMedia(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)
}

export default function ProviderProfile() {
  const { t } = useLanguage()
  const params = useParams()
  const id = String(params.id)

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

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
          <h1 className="text-3xl font-semibold">{t("providerProfileTitle")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t("providerProfileSubtitle")}
          </p>
        </section>

        {loading && <div className="card-surface mt-6 h-32 animate-pulse rounded-[12px]" />}

        {!loading && services.length === 0 && (
          <div className="card-surface mt-6 rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
            {t("providerProfileEmpty")}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="card-surface rounded-[12px] p-5">
              <p className="font-semibold">{service.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {service.description || t("providerProfileDescriptionFallback")}
                </p>
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
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
