"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Service } from "@/app/types"
import {
  categoryBySlug,
  getServiceCategory,
  serviceCategories,
} from "@/app/serviceCatalog"
import { formatDistanceKm, getDistanceKm, type Coords } from "@/app/location"
import { useLanguage } from "@/components/LanguageProvider"
import { PILOT_MODE_ENABLED, isPilotCity, pilotCityLabel } from "@/lib/pilotMode"
import AdSlot from "@/components/AdSlot"
import { getCached, setCached } from "@/lib/clientCache"
import { featureFlags } from "@/lib/featureFlags"
import ServiceListingCard from "@/components/ServiceListingCard"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import { getServicesCatalogData } from "@/lib/publicCatalogApi"

type SortMode = "rating" | "price" | "distance" | "newest"

export default function Services() {
  const { t } = useLanguage()
  const { content } = useSiteSettings()
  const pageContent = content["page:services"] as { title?: string; subtitle?: string; is_active?: boolean } | undefined
  const [services, setServices] = useState<Service[]>([])
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [locationFilter, setLocationFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortMode>("rating")
  const [loading, setLoading] = useState(true)
  const [viewerCoords, setViewerCoords] = useState<Coords | null>(null)
  const [distanceMessage, setDistanceMessage] = useState("")
  const [ratingsByService, setRatingsByService] = useState<
    Record<string, { average: number; count: number }>
  >({})

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search)
      setQuery(params.get("q") ?? "")
      setActiveCategory(params.get("category") ?? "all")
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const fetchServices = async () => {
      const cachedServices = getCached<Service[]>("hilfino:services:list")
      const cachedRatings = getCached<Record<string, { average: number; count: number }>>(
        "hilfino:services:ratings"
      )

      if (cachedServices && cachedRatings) {
        setServices(cachedServices)
        setRatingsByService(cachedRatings)
        setLoading(false)
        return
      }

      try {
        const data = await getServicesCatalogData()
        setServices(data.services)
        setRatingsByService(data.ratingsByService)
        setCached("hilfino:services:list", data.services, 45_000)
        setCached("hilfino:services:ratings", data.ratingsByService, 45_000)
      } finally {
        setLoading(false)
      }
    }

    void fetchServices()
  }, [])

  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        const inPilotScope =
          !PILOT_MODE_ENABLED || isPilotCity(service.city ?? undefined)

        const category = getServiceCategory(service)
        const searchableText = [
          service.title,
          service.description,
          service.provider_name,
          service.city,
          service.district,
          t(category.labelKey),
        ]
          .join(" ")
          .toLowerCase()

        const matchesQuery = searchableText.includes(query.toLowerCase())
        const matchesLocation = locationFilter
          ? `${service.city ?? ""} ${service.district ?? ""}`
              .toLowerCase()
              .includes(locationFilter.toLowerCase())
          : true
        const matchesCategory =
          activeCategory === "all" || category.slug === activeCategory

        return inPilotScope && matchesQuery && matchesCategory && matchesLocation
      }),
    [activeCategory, locationFilter, query, services, t]
  )

  const sortedServices = useMemo(() => {
    const entries = [...filteredServices]
    entries.sort((a, b) => {
      if (sortBy === "rating") {
        const aRating = ratingsByService[a.id]?.average ?? 0
        const bRating = ratingsByService[b.id]?.average ?? 0
        return bRating - aRating
      }

      if (sortBy === "price") {
        const aPrice = a.price_from_eur ?? Number.POSITIVE_INFINITY
        const bPrice = b.price_from_eur ?? Number.POSITIVE_INFINITY
        return aPrice - bPrice
      }

      if (sortBy === "distance") {
        if (!viewerCoords) return 0
        const aDistance =
          a.approx_lat != null && a.approx_lng != null
            ? getDistanceKm(viewerCoords, { lat: a.approx_lat, lng: a.approx_lng })
            : Number.POSITIVE_INFINITY
        const bDistance =
          b.approx_lat != null && b.approx_lng != null
            ? getDistanceKm(viewerCoords, { lat: b.approx_lat, lng: b.approx_lng })
            : Number.POSITIVE_INFINITY
        return aDistance - bDistance
      }

      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
      return bCreated - aCreated
    })
    return entries
  }, [filteredServices, ratingsByService, sortBy, viewerCoords])

  const activeCategoryLabel =
    activeCategory === "all"
      ? t("allServices")
      : categoryBySlug.get(activeCategory)
        ? t(categoryBySlug.get(activeCategory)!.labelKey)
        : t("allServices")

  const captureViewerLocation = () => {
    if (!navigator.geolocation) {
      setDistanceMessage("Standortfreigabe wird auf diesem Gerät nicht unterstützt.")
      return
    }

    setDistanceMessage("")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewerCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        setDistanceMessage("Standort konnte nicht gelesen werden.")
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const getServiceDistance = (service: Service) => {
    if (!viewerCoords || service.approx_lat == null || service.approx_lng == null) {
      return null
    }

    const distance = getDistanceKm(viewerCoords, {
      lat: service.approx_lat,
      lng: service.approx_lng,
    })

    return formatDistanceKm(distance)
  }

  return (
    <main className="readable-page min-h-screen text-slate-950 dark:text-slate-100">
      <section className="border-b border-slate-200/80 bg-white/85 px-6 py-12 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl animate-float-up">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            {t("servicesEyebrow")}
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              {pageContent?.is_active === false ? t("servicesTitle") : pageContent?.title || t("servicesTitle")}
            </h1>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              {pageContent?.is_active === false ? t("servicesText") : pageContent?.subtitle || t("servicesText")}
            </p>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
            <label className="sr-only" htmlFor="service-search">
              {t("servicesSearchLabel")}
            </label>
            <input
              id="service-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("servicesSearchPlaceholder")}
              className="field-input min-h-14 rounded-[10px] px-4 text-base transition"
            />
            <label className="sr-only" htmlFor="service-location-filter">
              {t("servicesLocationFilter")}
            </label>
            <input
              id="service-location-filter"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              placeholder={t("servicesLocationFilter")}
              className="field-input min-h-14 rounded-[10px] px-4 text-base transition"
            />
            <button
              type="button"
              onClick={captureViewerLocation}
              className="btn-secondary min-h-14 justify-center px-4 py-3 text-sm font-semibold"
            >
              Standort freigeben
            </button>
            <Link
              href="/create-service"
              className="flex min-h-14 items-center justify-center rounded-[10px] bg-[var(--brand)] px-6 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              {t("offerService")}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="services-sort" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("servicesSortLabel")}
            </label>
            <select
              id="services-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortMode)}
              className="field-input min-h-11 rounded-[10px] px-3 text-sm"
            >
              <option value="rating">{t("servicesSortBestRated")}</option>
              <option value="price">{t("servicesSortPrice")}</option>
              <option value="distance">{t("servicesSortDistance")}</option>
              <option value="newest">{t("servicesSortNewest")}</option>
            </select>
          </div>
          {PILOT_MODE_ENABLED && (
            <div className="panel-muted mt-4 rounded-[12px] p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("pilotBannerTitle")}
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {t("pilotBannerText")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                  {pilotCityLabel()}
                </span>
                <Link
                  href="/waitlist"
                  className="text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  {t("waitlistCta")}
                </Link>
              </div>
            </div>
          )}
          {distanceMessage && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {distanceMessage}
            </p>
          )}

          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === "all"
                  ? "bg-[var(--brand)] text-white"
                  : "card-surface text-slate-800 dark:text-slate-200"
              }`}
            >
              {t("all")}
            </button>
            {serviceCategories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setActiveCategory(category.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category.slug
                    ? "bg-[var(--brand)] text-white"
                    : "card-surface text-slate-800 dark:text-slate-200"
                }`}
              >
                {t(category.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl animate-float-up">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold">{activeCategoryLabel}</h2>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {loading
                  ? t("loadingServices")
                  : `${sortedServices.length} ${sortedServices.length === 1 ? t("matchingService") : t("matchingServices")}`}
              </p>
            </div>
            <p className="card-surface rounded-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {viewerCoords
                ? "Entfernungen werden grob angezeigt."
                : t("verifiedSoon")}
            </p>
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="card-surface h-56 animate-pulse rounded-[10px]"
                />
              ))}
            </div>
          )}

          {!loading && sortedServices.length === 0 && (
            <div className="card-surface rounded-[12px] border-dashed p-10 text-center">
              <h3 className="text-xl font-semibold">{t("noServicesTitle")}</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
                {t("noServicesText")}
              </p>
              <Link
                href="/create-service"
                className="mt-6 inline-flex rounded-[10px] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                {t("createService")}
              </Link>
            </div>
          )}

          {!loading && sortedServices.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedServices.map((service) => {
                const category = getServiceCategory(service)
                const distance = getServiceDistance(service)
                return (
                  <div key={service.id} className="space-y-2">
                    <ServiceListingCard
                      service={service}
                      categoryLabel={t(category.labelKey)}
                      distanceLabel={distance ? `${distance} entfernt` : null}
                      ratingAverage={ratingsByService[service.id]?.average ?? null}
                      ratingCount={ratingsByService[service.id]?.count ?? 0}
                    />
                    <div className="flex flex-wrap gap-2 px-1">
                      {featureFlags.enablePremiumProfiles && service.is_premium && (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Premium
                        </span>
                      )}
                      {featureFlags.enableBoostedVisibility && service.boost_until && (
                        <span className="rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                          Boost
                        </span>
                      )}
                      {service.is_volunteer && (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Ehrenamtlich
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-2 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <AdSlot slot={process.env.NEXT_PUBLIC_GOOGLE_ADS_SLOT_SERVICES ?? ""} />
        </div>
      </section>
    </main>
  )
}
