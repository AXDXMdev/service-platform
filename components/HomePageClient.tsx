"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getServiceCategory, serviceCategories } from "@/app/serviceCatalog"
import { ServiceCategoryIcon } from "@/app/serviceIcons"
import { useLanguage } from "@/components/LanguageProvider"
import type { Service } from "@/app/types"
import ServiceListingCard from "@/components/ServiceListingCard"
import { getCached, setCached } from "@/lib/clientCache"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import { getHomeFeaturedData } from "@/lib/publicCatalogApi"
import { pilotCityLabel } from "@/lib/pilotMode"

type HomePageClientProps = {
  initialFeaturedServices: Service[]
  initialRatingsByService: Record<string, { average: number; count: number }>
  initialLoaded?: boolean
}

export default function Home({
  initialFeaturedServices,
  initialRatingsByService,
  initialLoaded = false,
}: HomePageClientProps) {
  const { t } = useLanguage()
  const { site, sections, content } = useSiteSettings()
  const pageContent = content["page:home"] as { title?: string; subtitle?: string; is_active?: boolean } | undefined
  const [featuredServices, setFeaturedServices] = useState<Service[]>(initialFeaturedServices)
  const [featuredLoading, setFeaturedLoading] = useState(false)
  const [ratingsByService, setRatingsByService] = useState<
    Record<string, { average: number; count: number }>
  >(initialRatingsByService)

  useEffect(() => {
    const loadFeatured = async () => {
      if (initialLoaded) return

      const cachedServices = getCached<Service[]>("hilfino:home:featured")
      const cachedRatings = getCached<Record<string, { average: number; count: number }>>("hilfino:home:ratings")

      if (cachedServices && cachedRatings) {
        setFeaturedServices(cachedServices)
        setRatingsByService(cachedRatings)
        setFeaturedLoading(false)
        return
      }

      try {
        const data = await getHomeFeaturedData()
        setFeaturedServices(data.featuredServices)
        setRatingsByService(data.ratingsByService)
        setCached("hilfino:home:featured", data.featuredServices, 45_000)
        setCached("hilfino:home:ratings", data.ratingsByService, 45_000)
      } finally {
        setFeaturedLoading(false)
      }
    }

    void loadFeatured()
  }, [initialLoaded])

  const trustBadges = useMemo(
    () =>
      site.trust_badges.length > 0
        ? site.trust_badges
        : [
            t("trustBadgeVerified"),
            t("trustBadgeSecure"),
            t("trustBadgeRatings"),
            t("trustBadgePilot"),
            t("trustBadgePrivacy"),
          ],
    [site.trust_badges, t]
  )

  const sectionEnabled = (key: string) =>
    sections.length === 0 || sections.some((section) => section.key === key && section.enabled)

  return (
    <main className="home-with-sticky-cta readable-page text-slate-950 dark:text-slate-100">
      {sectionEnabled("hero") && (
        <section className="home-hero relative isolate overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(135deg,#fbfdff_0%,#f3f7ff_52%,#eef3ff_100%)] dark:border-slate-800/80 dark:bg-[linear-gradient(135deg,#0b1220_0%,#111c2d_54%,#182344_100%)]">
          <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_76%_12%,rgba(91,75,255,0.16),transparent_34%),radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_76%_12%,rgba(96,165,250,0.2),transparent_34%),radial-gradient(circle_at_18%_8%,rgba(91,75,255,0.18),transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl opacity-100">
              <p
                className="mb-5 w-fit rounded-full bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-[var(--brand)]/12 dark:bg-white/8 dark:ring-white/10"
                style={{ color: "var(--hero-eyebrow)" }}
              >
                {t("heroBadge")}
              </p>

              <h1
                className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[4.35rem]"
                style={{ color: "var(--hero-title)" }}
              >
                {site.hero_title ||
                  (pageContent?.is_active === false ? t("heroTitle") : pageContent?.title) ||
                  t("heroTitle")}
              </h1>

              <p
                className="mt-5 max-w-3xl text-base font-medium leading-8 sm:text-lg"
                style={{ color: "var(--hero-subtitle)" }}
              >
                {site.hero_subheadline ||
                  (pageContent?.is_active === false ? t("heroSubheadline") : pageContent?.subtitle) ||
                  t("heroSubheadline")}
              </p>

              <p
                className="mt-4 max-w-3xl text-base leading-7"
                style={{ color: "var(--hero-body)" }}
              >
                {t("heroText")}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="btn-primary min-h-12 rounded-[10px] px-5 py-3 text-sm font-semibold text-white sm:text-base"
                >
                  {site.hero_cta_find || t("heroCtaFind")}
                </Link>
                <Link
                  href="/create-service"
                  className="btn-secondary min-h-12 rounded-[10px] px-5 py-3 text-sm font-semibold sm:text-base"
                >
                  {site.hero_cta_offer || t("heroCtaOffer")}
                </Link>
              </div>

              <form
                action="/services"
                className="mt-8 flex w-full max-w-3xl flex-col gap-3 rounded-[16px] border border-slate-200 bg-white/92 p-2 shadow-[0_22px_55px_-40px_rgba(35,45,100,0.5)] dark:border-slate-700 dark:bg-slate-950/86 sm:flex-row"
              >
                <input
                  name="q"
                  aria-label={t("heroSearchLabel")}
                  placeholder={t("heroSearchPlaceholder")}
                  className="field-input min-h-14 flex-1 rounded-[10px] px-4 text-base transition"
                />
                <button
                  type="submit"
                  className="btn-primary min-h-14 justify-center rounded-[10px] px-7 font-semibold text-white"
                >
                  {t("heroSearchButton")}
                </button>
              </form>

              <div className="mt-6 flex max-w-4xl flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 dark:text-slate-300">
                {trustBadges.slice(0, 5).map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid max-w-4xl gap-3 rounded-[14px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.5)] dark:border-slate-700 dark:bg-slate-950/72 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                    Pilotstädte
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {pilotCityLabel()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                    Plattformrolle
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Vermittlung, kein Vertragspartner
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                    Sicherheit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Consent, Meldesystem und geprüfte Profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {sectionEnabled("featured_services") && (
      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl animate-float-up">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {t("allServices")}
            </h2>
            <Link href="/services" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              {t("heroCtaFind")}
            </Link>
          </div>
          {featuredLoading && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="card-surface h-64 animate-pulse rounded-[12px]" />
              ))}
            </div>
          )}

          {!featuredLoading && featuredServices.length === 0 && (
            <div className="card-surface rounded-[12px] border-dashed p-7 text-center">
              <h3 className="text-xl font-semibold">{t("noServicesTitle")}</h3>
              <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
                {t("noServicesText")}
              </p>
              <Link
                href="/create-service"
                className="btn-primary mt-5 min-h-11 justify-center px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t("createService")}
              </Link>
            </div>
          )}

          {!featuredLoading && featuredServices.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredServices.map((service) => (
                <ServiceListingCard
                  key={service.id}
                  service={service}
                  categoryLabel={t(getServiceCategory(service).labelKey)}
                  ratingAverage={ratingsByService[service.id]?.average ?? null}
                  ratingCount={ratingsByService[service.id]?.count ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {sectionEnabled("confidence") && (
      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl animate-float-up">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                {t("confidenceEyebrow")}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
                {t("confidenceTitle")}
              </h2>
            </div>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              {t("confidenceText")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/services?category=${category.slug}`}
                className="card-surface interactive-card group rounded-[12px] p-6"
              >
                <div className="icon-chip mb-8 flex h-12 w-12 items-center justify-center rounded-[10px] text-white">
                  <ServiceCategoryIcon slug={category.slug} className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{t(category.labelKey)}</h3>
                <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
                  {t(category.descriptionKey)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {sectionEnabled("trust_cards") && (
      <section className="px-6 py-4 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {[
            [t("trustClearTitle"), t("trustClearText")],
            [t("trustSignalTitle"), t("trustSignalText")],
            [t("trustProviderTitle"), t("trustProviderText")],
          ].map(([title, description]) => (
            <div key={title} className="card-surface rounded-[12px] p-6">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {sectionEnabled("provider_cta") && (
      <section className="px-6 py-16 sm:px-10 lg:px-12">
        <div className="provider-cta inverse-surface mx-auto flex max-w-7xl flex-col justify-between gap-6 rounded-[14px] bg-slate-900 p-6 text-white sm:p-10 lg:flex-row lg:items-center dark:bg-slate-800">
          <div className="max-w-3xl">
            <h2 className="provider-cta-title text-2xl font-semibold text-white sm:text-3xl">
              {t("providerCtaTitle")}
            </h2>
            <p
              className="provider-cta-copy mt-3 max-w-2xl text-base font-medium leading-7 sm:text-lg"
              style={{ color: "#e2e8f0" }}
            >
              {t("providerCtaText")}
            </p>
          </div>
          <Link
            href="/create-service"
            className="btn-primary w-full justify-center rounded-[10px] px-6 py-3 font-semibold text-white sm:w-fit"
          >
            {t("providerCtaButton")}
          </Link>
        </div>
      </section>
      )}

      <div className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-2 md:hidden">
        <Link
          href="/services"
          className="btn-primary min-h-12 justify-center rounded-[10px] px-3 py-2 text-sm font-semibold text-white shadow-lg"
        >
          {site.hero_cta_find || t("heroCtaFind")}
        </Link>
        <Link
          href="/create-service"
          className="btn-secondary min-h-12 justify-center rounded-[10px] px-3 py-2 text-sm font-semibold shadow-lg"
        >
          {site.hero_cta_offer || t("heroCtaOffer")}
        </Link>
      </div>
    </main>
  )
}
