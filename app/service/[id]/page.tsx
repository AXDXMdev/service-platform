"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
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

function isVideoMedia(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)
}

export default function ServiceDetail() {
  const { t } = useLanguage()
  const params = useParams()
  const id = String(params.id)
  const [service, setService] = useState<Service | null>(null)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [viewerCoords, setViewerCoords] = useState<Coords | null>(null)
  const [ratingCount, setRatingCount] = useState(0)
  const [ratingAverage, setRatingAverage] = useState<number | null>(null)
  const [customerBudget, setCustomerBudget] = useState("")
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
    <main className="readable-page min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card-surface animate-float-up rounded-[14px] p-7">
          <div className="flex items-start gap-4">
            <div className="icon-chip flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] text-white">
              {category && <ServiceCategoryIcon slug={category.slug} className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold">{service.title}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {service.provider_name ?? "Independent provider"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {service.is_verified && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Verifizierter Anbieter
                  </span>
                )}
                {ratingAverage !== null && (
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {ratingAverage}/5 ({ratingCount})
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="panel-muted mt-7 rounded-[10px] p-5 leading-7 text-slate-700 dark:text-slate-200">
            {service.description || "Beschreibung folgt in Kürze."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="panel-muted rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Standort
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {service.city
                  ? `${service.city}${service.district ? `, ${service.district}` : ""}`
                  : "Nicht angegeben"}
              </p>
            </div>
            <div className="panel-muted rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Erfahrung
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {service.years_experience
                  ? `${service.years_experience}+ Jahre`
                  : "Nicht angegeben"}
              </p>
            </div>
          </div>
          {(service.availability_days?.length ?? 0) > 0 && (
            <div className="panel-muted mt-4 rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Verfügbarkeit
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

          {service.provider_bio && (
            <p className="panel-muted mt-4 rounded-[10px] p-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {service.provider_bio}
            </p>
          )}

          {(service.media_urls?.length ?? 0) > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Arbeitsbeispiele
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(service.media_urls ?? []).slice(0, 6).map((url) =>
                  isVideoMedia(url) ? (
                    <video
                      key={url}
                      src={url}
                      controls
                      preload="metadata"
                      className="w-full rounded-[10px] border border-slate-200 bg-black dark:border-slate-700"
                    />
                  ) : (
                    <Image
                      key={url}
                      src={url}
                      alt="Arbeitsbeispiel"
                      width={1200}
                      height={800}
                      className="h-52 w-full rounded-[10px] border border-slate-200 object-cover dark:border-slate-700"
                    />
                  )
                )}
              </div>
            </div>
          )}

          {service.user_id && (
            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
              <Link
                href={`/provider/${service.user_id}`}
                className="font-semibold text-[var(--brand)] hover:underline"
              >
                {t("serviceProviderProfileLink")}
              </Link>
            </p>
          )}
        </section>

        <aside id="anfrage" className="card-surface animate-float-up h-fit rounded-[14px] p-6 lg:sticky lg:top-28">
          <h2 className="text-xl font-semibold">{t("serviceRequestTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("serviceRequestText")}
          </p>

          <button
            type="button"
            className="btn-secondary mt-4 min-h-11 w-full justify-center px-4 py-2 text-sm font-semibold"
            onClick={() => {
              if (!navigator.geolocation) {
                setMessage(t("serviceDistanceUnsupported"))
                return
              }
              navigator.geolocation.getCurrentPosition(
                (position) =>
                  setViewerCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  }),
                () => setMessage(t("serviceDistanceFailed")),
                { enableHighAccuracy: false, timeout: 8000 }
              )
            }}
          >
            {t("serviceDistanceAction")}
          </button>

          {distance && (
            <p className="mt-3 text-sm font-semibold text-[var(--brand)]">
              {distance} {t("serviceDistanceAway")}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-[8px] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="button"
            className="action-ghost mt-3 w-full"
            onClick={async () => {
              if (!currentUserId) {
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
                setMessage(await readApiErrorMessage(response))
              }
            }}
          >
            {isFavorite ? t("serviceFavoritesRemove") : t("serviceFavoritesAdd")}
          </button>

          <input
            className="field-input mt-4 min-h-11 w-full rounded-[10px] px-3"
            inputMode="decimal"
            placeholder={t("serviceBudgetPlaceholder")}
            value={customerBudget}
            onChange={(event) =>
              setCustomerBudget(event.target.value.replace(/[^0-9.,]/g, ""))
            }
          />

          <button
            type="button"
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={sending}
            onClick={async () => {
              setSending(true)
              setMessage("")

              if (Number.isNaN(parsedCustomerBudget)) {
                setMessage(t("serviceBudgetInvalid"))
                setSending(false)
                return
              }

              try {
                await createServiceRequest({
                  serviceId: id,
                  customerBudgetEur: parsedCustomerBudget,
                })
                setMessage(t("serviceRequestSent"))
              } catch {
                setMessage(t("serviceRequestError"))
              }
              setSending(false)
            }}
          >
            {sending ? t("serviceRequestSending") : t("serviceRequestAction")}
          </button>
        </aside>
      </div>
    </main>
  )
}
