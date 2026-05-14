"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Favorite, Service } from "@/app/types"
import { useLanguage } from "@/components/LanguageProvider"
import { getFavoritesData } from "@/lib/dashboardApi"

export default function FavoritesPage() {
  const { t } = useLanguage()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const data = await getFavoritesData()
        setFavorites(data.favorites)
        setServices(data.services)
      } catch (error) {
        const text = error instanceof Error ? error.message : t("favoritesLoadError")
        setMessage(/Migration|Favoriten werden aktiv/i.test(text) ? t("favoritesMigrationHint") : text)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [t])

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl animate-float-up">
        <h1 className="text-3xl font-semibold">{t("favoritesTitle")}</h1>
        {message && (
          <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {message}
          </p>
        )}

        {loading && <div className="card-surface mt-6 h-40 animate-pulse rounded-[12px]" />}

        {!loading && favorites.length === 0 && (
          <div className="card-surface mt-6 rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
            {t("favoritesEmpty")}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {favorites.map((favorite) => {
            const service = services.find((item) => item.id === favorite.service_id)
            if (!service) return null

            return (
              <div key={favorite.id} className="card-surface rounded-[12px] p-5">
                <p className="font-semibold">{service.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {service.provider_name ?? t("favoritesProviderFallback")}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {service.description ?? t("favoritesDescriptionFallback")}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/service/${service.id}`}
                    className="action-btn action-complete"
                  >
                    {t("favoritesServiceLink")}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
