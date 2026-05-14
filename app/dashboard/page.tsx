"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Service, ServiceRequest } from "@/app/types"
import { getProviderDashboardData } from "@/lib/dashboardApi"
import {
  canProviderTransition,
  updateProviderOffer,
  requestStatusRank,
  type RequestStatus,
  statusLabel,
  statusTone,
  updateRequestStatus,
} from "@/lib/requestWorkflow"

type RequestFilter = "active" | "pending" | "accepted" | "completed" | "archive"

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }).format(new Date(value))
    : "Neu"

const statusProgress = (status: ServiceRequest["status"]) => {
  if (status === "completed") return 100
  if (status === "accepted") return 66
  if (status === "rejected" || status === "cancelled") return 100
  return 33
}

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState("")
  const [providerOfferDraft, setProviderOfferDraft] = useState<Record<string, string>>({})
  const [providerUserId, setProviderUserId] = useState<string>("")
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("active")
  const totalViews = services.length * 17
  const completedJobs = requests.filter((item) => item.status === "completed").length
  const openRequests = requests.filter((item) => (item.status ?? "pending") === "pending").length
  const estimatedEarnings = requests.reduce((sum, item) => {
    if (item.provider_offer_eur) return sum + Number(item.provider_offer_eur)
    if (item.final_price_eur) return sum + Number(item.final_price_eur)
    return sum
  }, 0)

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const rankDiff = requestStatusRank(a.status) - requestStatusRank(b.status)
        if (rankDiff !== 0) return rankDiff
        return (
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
        )
      }),
    [requests]
  )

  const filteredRequests = useMemo(
    () =>
      sortedRequests.filter((request) => {
        const status = request.status ?? "pending"
        if (requestFilter === "active") return ["pending", "accepted"].includes(status)
        if (requestFilter === "archive") return ["rejected", "cancelled"].includes(status)
        return status === requestFilter
      }),
    [requestFilter, sortedRequests]
  )

  const requestFilters: Array<{ key: RequestFilter; label: string; count: number }> = [
    {
      key: "active",
      label: "Aktiv",
      count: requests.filter((item) => ["pending", "accepted"].includes(item.status ?? "pending")).length,
    },
    { key: "pending", label: "Offen", count: openRequests },
    { key: "accepted", label: "Angenommen", count: requests.filter((item) => item.status === "accepted").length },
    { key: "completed", label: "Erledigt", count: completedJobs },
    {
      key: "archive",
      label: "Archiv",
      count: requests.filter((item) => ["rejected", "cancelled"].includes(item.status ?? "")).length,
    },
  ]

  const changeStatus = async (
    request: ServiceRequest,
    nextStatus: RequestStatus,
    successMessage: string,
    failureMessage: string
  ) => {
    setActionMessage("")
    if (!canProviderTransition(request.status, nextStatus)) {
      setActionMessage("Dieser Statuswechsel ist für diese Anfrage nicht mehr möglich.")
      return
    }

      try {
      await updateRequestStatus({
        requestId: request.id,
        nextStatus,
        currentStatus: request.status,
        actorId: providerUserId || null,
        note: nextStatus === "deleted" ? "Durch Anbieter gelöscht" : null,
      })
      setRequests((current) =>
        nextStatus === "deleted"
          ? current.filter((item) => item.id !== request.id)
          : current.map((item) =>
              item.id === request.id
                ? {
                    ...item,
                    status: nextStatus,
                    final_price_eur:
                      nextStatus === "completed"
                        ? item.provider_offer_eur ?? item.final_price_eur
                        : item.final_price_eur,
                  }
                : item
            )
      )
      setActionMessage(successMessage)
    } catch {
      setActionMessage(failureMessage)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProviderDashboardData()
        setProviderUserId(data.currentUserId)
        setServices(data.services)
        setRequests(data.requests)
      } catch (error) {
        setActionMessage(
          error instanceof Error ? error.message : "Dashboard konnte nicht geladen werden."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  return (
    <main className="readable-page min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl animate-float-up">
        <div className="card-surface overflow-hidden rounded-[18px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/70 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">
              Anbieterbereich
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Mein Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
              Behalte Services, neue Anfragen, Angebote und Abschlussstatus an einem Ort im Blick.
            </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/create-service"
                className="btn-primary min-h-11 justify-center px-4 py-2 text-sm font-semibold"
              >
                Service erstellen
              </Link>
              <Link
                href="/provider-verification"
                className="btn-secondary min-h-11 justify-center px-4 py-2 text-sm font-semibold"
              >
                Verifizierung beantragen
              </Link>
            </div>
          </div>
        </div>
        {actionMessage && (
          <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {actionMessage}
          </p>
        )}

        {loading && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="card-surface h-36 animate-pulse rounded-[12px]"
              />
            ))}
          </div>
        )}

        {!loading && (
          <>
            <section className="mt-8">
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Offene Anfragen", value: openRequests, hint: "brauchen Antwort" },
                  { label: "Profilaufrufe", value: totalViews, hint: "geschätzt" },
                  { label: "Abgeschlossen", value: completedJobs, hint: "Buchungen" },
                  { label: "Umsatz", value: `${estimatedEarnings.toFixed(2)} EUR`, hint: "geschätzt" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="card-surface rounded-[14px] border border-slate-200/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700/70"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.hint}
                    </p>
                  </div>
                ))}
              </div>
              <div className="panel-muted mb-5 grid gap-3 rounded-[14px] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Wachstum
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Referral-Link für neue Anbieter, ideal für lokale Partner und Teams.
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--brand)]">
                    {(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")}/register?ref=
                    {providerUserId.slice(0, 8)}
                  </p>
                </div>
                <Link href="/apps" className="action-ghost justify-center">
                  App-Slot ansehen
                </Link>
              </div>
              <div className="panel-muted mb-5 grid gap-3 rounded-[14px] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Datenschutz und Support
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Daten exportieren, Konto loeschen oder einen problematischen Inhalt melden.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/account/privacy" className="action-ghost justify-center">
                    Kontorechte
                  </Link>
                  <Link href="/report" className="action-ghost justify-center">
                    Problem melden
                  </Link>
                </div>
              </div>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Meine Services</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Sichtbarkeit, Trust und Beschreibung entscheiden, ob Kunden anfragen.
                  </p>
                </div>
                <Link href="/create-service" className="action-ghost justify-center">
                  Neuen Service anlegen
                </Link>
              </div>
              {services.length === 0 && (
                <div className="card-surface rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
                  Noch keine Services angelegt.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="card-surface rounded-[14px] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-950 dark:text-slate-100">{service.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          service.is_verified
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {service.is_verified ? "Verifiziert" : "Prüfung offen"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {service.description || "Keine Beschreibung"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                        {service.city || "Ort offen"}
                      </span>
                      {service.price_from_eur != null && (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-300">
                          ab {service.price_from_eur} EUR
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Eingegangene Anfragen</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Neue Anfragen oben, erledigte und archivierte Anfragen bleiben sauber getrennt.
                  </p>
                </div>
              </div>
              <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-2">
                {requestFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setRequestFilter(filter.key)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      requestFilter === filter.key
                        ? "bg-[var(--brand)] text-white"
                        : "card-surface text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
              {requests.length === 0 && (
                <div className="card-surface rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
                  Aktuell keine Anfragen.
                </div>
              )}
              {requests.length > 0 && filteredRequests.length === 0 && (
                <div className="card-surface rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
                  Keine Anfragen in diesem Status.
                </div>
              )}
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const service = services.find((s) => s.id === request.service_id)
                  const status = request.status ?? "pending"

                  return (
                    <div key={request.id} className="card-surface rounded-[14px] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-100">
                            {service?.title ?? "Service"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Anfrage von {request.sender_email ?? "Unbekannt"} · {formatDate(request.created_at)}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusTone(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[var(--brand)] transition-all"
                          style={{ width: `${statusProgress(status)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                        {request.customer_budget_eur != null && (
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300">
                            Kundenbudget: {request.customer_budget_eur} EUR
                          </span>
                        )}
                        {request.provider_offer_eur != null && (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                            Dein Angebot: {request.provider_offer_eur} EUR
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          className="field-input min-h-10 w-full rounded-[8px] px-3 text-sm"
                          placeholder="Preisangebot in EUR"
                          inputMode="decimal"
                          value={providerOfferDraft[request.id] ?? ""}
                          onChange={(event) =>
                            setProviderOfferDraft((current) => ({
                              ...current,
                              [request.id]: event.target.value.replace(/[^0-9.,]/g, ""),
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="action-ghost whitespace-nowrap"
                          onClick={async () => {
                            const raw = providerOfferDraft[request.id]
                            if (!raw) return
                            const amount = Number(raw.replace(",", "."))
                            if (!Number.isFinite(amount) || amount <= 0) {
                              setActionMessage("Bitte ein gueltiges Preisangebot eingeben.")
                              return
                            }
                            try {
                              await updateProviderOffer({
                                requestId: request.id,
                                providerOfferEur: amount,
                              })
                            } catch (error) {
                              setActionMessage(
                                error instanceof Error
                                  ? error.message
                                  : "Preisangebot konnte nicht gespeichert werden."
                              )
                              return
                            }
                            setRequests((current) =>
                              current.map((item) =>
                                item.id === request.id
                                  ? { ...item, provider_offer_eur: amount }
                                  : item
                              )
                            )
                            setActionMessage("Preisangebot gespeichert.")
                          }}
                        >
                          Angebot senden
                        </button>
                      </div>

                      <div className="panel-muted mt-4 flex flex-wrap gap-2 rounded-[10px] p-3">
                        {canProviderTransition(status, "accepted") && (
                          <button
                            className="action-btn action-accept"
                            onClick={() =>
                              void changeStatus(
                                request,
                                "accepted",
                                "Anfrage wurde angenommen.",
                                "Anfrage konnte nicht angenommen werden."
                              )
                            }
                          >
                            Annehmen
                          </button>
                        )}
                        {canProviderTransition(status, "rejected") && (
                          <button
                            className="action-btn action-reject"
                            onClick={() =>
                              void changeStatus(
                                request,
                                "rejected",
                                "Anfrage wurde abgelehnt.",
                                "Anfrage konnte nicht abgelehnt werden."
                              )
                            }
                          >
                            Ablehnen
                          </button>
                        )}
                        {canProviderTransition(status, "completed") && (
                          <button
                            className="action-btn action-complete"
                            onClick={() =>
                              void changeStatus(
                                request,
                                "completed",
                                "Anfrage wurde als abgeschlossen markiert.",
                                "Status konnte nicht auf abgeschlossen gesetzt werden."
                              )
                            }
                          >
                            Abschliessen
                          </button>
                        )}
                        <button
                          className="action-btn action-danger"
                          onClick={async () => {
                            setActionMessage("")
                            const confirmed = window.confirm("Anfrage endgültig löschen?")
                            if (!confirmed) return
                            await changeStatus(
                              request,
                              "deleted",
                              "Anfrage wurde gelöscht.",
                              "Anfrage konnte nicht gelöscht werden."
                            )
                          }}
                        >
                          Löschen
                        </button>
                        <Link
                          href={`/chat/${request.id}`}
                          className="action-ghost"
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
