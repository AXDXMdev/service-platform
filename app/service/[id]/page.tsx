"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { Service } from "@/app/types"
import { getServiceCategory } from "@/app/serviceCatalog"
import { ServiceCategoryIcon } from "@/app/serviceIcons"
import { formatDistanceKm, getDistanceKm, type Coords } from "@/app/location"
import { useLanguage } from "@/components/LanguageProvider"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import { getServiceDetailData } from "@/lib/dashboardApi"
import { getCached, setCached } from "@/lib/clientCache"
import { createServiceRequest } from "@/lib/requestWorkflow"
import ProviderAvatar from "@/components/service-detail/ProviderAvatar"
import ServiceHeroGallery from "@/components/service-detail/ServiceHeroGallery"
import ConversionSignalGrid from "@/components/service-detail/ConversionSignalGrid"
import TrustBadgeGrid from "@/components/service-detail/TrustBadgeGrid"
import ReviewSnapshot from "@/components/service-detail/ReviewSnapshot"
import SafetyPanel from "@/components/service-detail/SafetyPanel"
import MobileStickyActions from "@/components/service-detail/MobileStickyActions"

export default function ServiceDetail() {
  const { t } = useLanguage()
  const params = useParams()
  const id = String(params.id)
  const [service, setService] = useState<Service | null>(null)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral")
  const [viewerCoords, setViewerCoords] = useState<Coords | null>(null)
  const [ratingCount, setRatingCount] = useState(0)
  const [ratingAverage, setRatingAverage] = useState<number | null>(null)
  const [customerBudget, setCustomerBudget] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [requestLocation, setRequestLocation] = useState("")
  const [contactPreference, setContactPreference] = useState("Hilfinio Chat")
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const parsedCustomerBudget = useMemo(() => {
    if (!customerBudget) return null
    const amount = Number(customerBudget.replace(",", "."))
    return Number.isFinite(amount) && amount > 0 && amount <= 100000 ? amount : Number.NaN
  }, [customerBudget])

  useEffect(() => {
    const fetchService = async () => {
      const cacheKey = `hilfino:service:${id}`
      const cached = getCached<{
        currentUserId: string | null
        service: Service
        isFavorite: boolean
        ratingCount: number
        ratingAverage: number | null
      }>(cacheKey)
      if (cached) {
        setCurrentUserId(cached.currentUserId)
        setService(cached.service)
        setIsFavorite(cached.isFavorite)
        setRatingCount(cached.ratingCount)
        setRatingAverage(cached.ratingAverage)
        return
      }

      try {
        const data = await getServiceDetailData(id)
        setCurrentUserId(data.currentUserId)
        setService(data.service)
        setIsFavorite(data.isFavorite)
        setRatingCount(data.ratingCount)
        setRatingAverage(data.ratingAverage)
        setCached(cacheKey, data, 45_000)
      } catch (error) {
        setMessageTone("error")
        setMessage(error instanceof Error ? error.message : t("serviceRequestError"))
      }
    }

    void fetchService()
  }, [id, t])

  const category = useMemo(() => (service ? getServiceCategory(service) : null), [service])

  const distance = useMemo(() => {
    if (!viewerCoords || !service || service.approx_lat == null || service.approx_lng == null) {
      return null
    }
    return formatDistanceKm(
      getDistanceKm(viewerCoords, { lat: service.approx_lat, lng: service.approx_lng })
    )
  }, [service, viewerCoords])

  const providerName = service?.provider_name ?? "Hilfinio Anbieter"
  const locationLabel = service?.city
    ? `${service.city}${service.district ? `, ${service.district}` : ""}`
    : "Standort nicht angegeben"
  const categoryLabel = category ? t(category.labelKey) : "Service"
  const priceLabel = service?.price_from_eur
    ? `ab ${service.price_from_eur} EUR`
    : "Preis auf Anfrage"

  const captureViewerLocation = () => {
    if (!navigator.geolocation) {
      setMessageTone("error")
      setMessage(t("serviceDistanceUnsupported"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setViewerCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => {
        setMessageTone("error")
        setMessage(t("serviceDistanceFailed"))
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const toggleFavorite = async () => {
    if (!currentUserId) {
      setMessageTone("error")
      setMessage(t("authLoginRequired"))
      return
    }

    if (isFavorite) {
      const response = await authenticatedFetch("/api/favorites", {
        method: "DELETE",
        body: JSON.stringify({ serviceId: id }),
      })
      if (response.ok) {
        setIsFavorite(false)
      } else {
        setMessageTone("error")
        setMessage(await readApiErrorMessage(response))
      }
      return
    }

    const response = await authenticatedFetch("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ serviceId: id }),
    })

    if (response.ok) {
      setIsFavorite(true)
    } else {
      setMessageTone("error")
      setMessage(await readApiErrorMessage(response))
    }
  }

  const submitRequest = async () => {
    setSending(true)
    setMessage("")
    setMessageTone("neutral")

    if (Number.isNaN(parsedCustomerBudget)) {
      setMessageTone("error")
      setMessage(t("serviceBudgetInvalid"))
      setSending(false)
      return
    }

    if (requestMessage.trim().length < 10) {
      setMessageTone("error")
      setMessage("Bitte beschreibe kurz, wobei du Hilfe brauchst.")
      setSending(false)
      return
    }

    try {
      const result = await createServiceRequest({
        serviceId: id,
        message: requestMessage.trim(),
        customerBudgetEur: parsedCustomerBudget,
        preferredDate: preferredDate.trim() || null,
        location: requestLocation.trim() || null,
        contactPreference,
      })
      setMessageTone("success")
      setMessage("Anfrage gesendet. Du kannst den Chat jetzt in deinen Anfragen oeffnen.")
      setRequestMessage("")
      setPreferredDate("")
      setRequestLocation("")
      if (result?.data?.id) {
        window.setTimeout(() => {
          window.location.href = `/chat/${result.data.id}`
        }, 900)
      }
    } catch {
      setMessageTone("error")
      setMessage(t("serviceRequestError"))
    }
    setSending(false)
  }

  if (!service) {
    return (
      <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="card-surface h-56 animate-pulse rounded-[12px]" />
        </div>
      </main>
    )
  }

  return (
    <main className="readable-page min-h-screen px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pb-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <ServiceHeroGallery
            title={service.title}
            categorySlug={category?.slug ?? "cleaning"}
            mediaUrls={service.media_urls}
          />

          <section className="card-surface animate-float-up rounded-[14px] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)]/10 px-3 py-1 font-semibold text-[var(--brand)]">
                    {category && <ServiceCategoryIcon slug={category.slug} className="h-4 w-4" />}
                    {categoryLabel}
                  </span>
                  <span className="rounded-full bg-slate-500/10 px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                    {locationLabel}
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 font-semibold text-blue-700 dark:text-blue-300">
                    {priceLabel}
                  </span>
                </div>
                <h1 className="mt-4 max-w-4xl break-words text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
                  {service.title}
                </h1>
                <p className="mt-3 max-w-3xl leading-7 text-slate-700 dark:text-slate-300">
                  {service.description || "Beschreibung folgt in Kuerze. Pruefe Profil, Trust-Signale und stelle eine konkrete Anfrage."}
                </p>
              </div>

              <Link
                id="anbieter"
                href={service.user_id ? `/provider/${service.user_id}` : "#anfrage"}
                className="card-surface interactive-card flex min-w-0 items-center gap-3 rounded-[12px] p-3 sm:w-72"
              >
                <ProviderAvatar name={providerName} imageUrl={service.provider_avatar_url} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950 dark:text-slate-100">
                    {providerName}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                    {service.is_verified ? "Verifizierter Anbieter" : "Anbieterprofil ansehen"}
                  </span>
                </span>
              </Link>
            </div>

            <div className="mt-5">
              <ConversionSignalGrid
                responseTimeMinutes={service.response_time_minutes}
                responseRatePercent={service.response_rate_percent}
                completedJobsCount={service.completed_jobs_count}
                repeatCustomerRatePercent={service.repeat_customer_rate_percent}
                lastActiveAt={service.provider_last_active_at}
                ratingAverage={ratingAverage}
                ratingCount={ratingCount}
              />
            </div>
          </section>

          <section className="card-surface rounded-[14px] p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
              Service-Details
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="panel-muted rounded-[10px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Standort
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                  {locationLabel}
                </p>
              </div>
              <div className="panel-muted rounded-[10px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Erfahrung
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                  {service.years_experience
                    ? `${service.years_experience}+ Jahre`
                    : "Noch nicht angegeben"}
                </p>
              </div>
              <div className="panel-muted rounded-[10px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Einsatzgebiet
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                  {service.service_radius_km ? `${service.service_radius_km} km Umkreis` : "Nach Anfrage klaeren"}
                </p>
              </div>
              <div className="panel-muted rounded-[10px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Preis
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                  {priceLabel}
                </p>
              </div>
            </div>

            {(service.availability_days?.length ?? 0) > 0 && (
              <div className="panel-muted mt-4 rounded-[10px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Verfuegbarkeit
                </p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                  {(service.availability_days ?? []).join(", ")}
                </p>
                {service.availability_note && (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {service.availability_note}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {service.is_volunteer && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Ehrenamtlich
                </span>
              )}
              {service.barrier_free_support && (
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Barrierearm
                </span>
              )}
              {service.supports_sign_language && (
                <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  Gebärdensprache möglich
                </span>
              )}
              {service.text_chat_only && (
                <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  Kommunikation per Chat
                </span>
              )}
            </div>
          </section>

          <TrustBadgeGrid service={service} />
          <ReviewSnapshot ratingAverage={ratingAverage} ratingCount={ratingCount} />
          <SafetyPanel />

          {service.provider_bio && (
            <section className="card-surface rounded-[14px] p-5 sm:p-7">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                Über den Anbieter
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {service.provider_bio}
              </p>
            </section>
          )}
        </div>

        <aside id="anfrage" className="card-surface animate-float-up h-fit rounded-[14px] p-6 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <ProviderAvatar name={providerName} imageUrl={service.provider_avatar_url} size="sm" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{t("serviceRequestTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {providerName}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("serviceRequestText")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="panel-muted rounded-[10px] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Preis
              </p>
              <p className="mt-1 font-semibold">{priceLabel}</p>
            </div>
            <div className="panel-muted rounded-[10px] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Trust
              </p>
              <p className="mt-1 font-semibold">
                {service.is_verified ? "Verifiziert" : "Pruefung offen"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary mt-4 min-h-11 w-full justify-center px-4 py-2 text-sm font-semibold"
            onClick={captureViewerLocation}
          >
            {t("serviceDistanceAction")}
          </button>

          {distance && (
            <p className="mt-3 text-sm font-semibold text-[var(--brand)]">
              {distance} {t("serviceDistanceAway")}
            </p>
          )}

          {message && (
            <p
              className={`mt-4 rounded-[8px] px-3 py-2 text-sm ${
                messageTone === "error"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : messageTone === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <div className="panel-muted mt-4 space-y-2 rounded-[10px] p-4 text-sm text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-slate-950 dark:text-slate-100">
              Sicher anfragen
            </p>
            <p>Teile sensible Daten erst, wenn Auftrag und Anbieter plausibel wirken.</p>
            <Link href="/report" className="font-semibold text-[var(--brand)] hover:underline">
              Problem oder Missbrauch melden
            </Link>
          </div>

          <button
            type="button"
            className="action-ghost mt-3 w-full"
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
          >
            {isFavorite ? t("serviceFavoritesRemove") : t("serviceFavoritesAdd")}
          </button>

          <div className="mt-4">
            <label
              htmlFor="request-message"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Wobei brauchst du Hilfe?
            </label>
            <textarea
              id="request-message"
              className="field-input mt-2 min-h-28 w-full resize-none rounded-[10px] px-3 py-3"
              maxLength={1500}
              placeholder="Beschreibe kurz Aufgabe, Zeitraum und wichtige Details."
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mindestens 10 Zeichen. Bitte keine Ausweis-, Bank- oder Passwortdaten senden.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label
                htmlFor="preferred-date"
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                Wunschzeitraum
              </label>
              <input
                id="preferred-date"
                className="field-input mt-2 min-h-11 w-full rounded-[10px] px-3"
                maxLength={120}
                placeholder="z. B. Freitag Nachmittag"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="request-location"
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                Einsatzort
              </label>
              <input
                id="request-location"
                className="field-input mt-2 min-h-11 w-full rounded-[10px] px-3"
                maxLength={160}
                placeholder={locationLabel}
                value={requestLocation}
                onChange={(event) => setRequestLocation(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="contact-preference"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Kontakt
            </label>
            <select
              id="contact-preference"
              className="field-input mt-2 min-h-11 w-full rounded-[10px] px-3"
              value={contactPreference}
              onChange={(event) => setContactPreference(event.target.value)}
            >
              <option>Hilfinio Chat</option>
              <option>Telefon nach Rueckmeldung</option>
              <option>E-Mail nach Rueckmeldung</option>
            </select>
          </div>

          <div className="mt-4">
            <label
              htmlFor="customer-budget"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Budgetrahmen
            </label>
            <input
              id="customer-budget"
              className="field-input mt-2 min-h-11 w-full rounded-[10px] px-3"
              inputMode="decimal"
              aria-describedby="customer-budget-hint"
              placeholder={t("serviceBudgetPlaceholder")}
              value={customerBudget}
              onChange={(event) =>
                setCustomerBudget(event.target.value.replace(/[^0-9.,]/g, ""))
              }
            />
            <p id="customer-budget-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Optional, hilft dem Anbieter bei einer passenden Rueckmeldung.
            </p>
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={sending}
            onClick={submitRequest}
          >
            {sending ? t("serviceRequestSending") : t("serviceRequestAction")}
          </button>
        </aside>
      </div>

      <MobileStickyActions
        isFavorite={isFavorite}
        sending={sending}
        onFavorite={toggleFavorite}
      />
    </main>
  )
}
