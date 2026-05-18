"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Review, Service, ServiceRequest } from "@/app/types"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import { getCustomerDashboardData } from "@/lib/dashboardApi"
import {
  canCustomerTransition,
  createServiceRequest,
  requestStatusRank,
  type RequestStatus,
  statusLabel,
  statusTone,
  updateRequestStatus,
} from "@/lib/requestWorkflow"

type CustomerRequestFilter = "active" | "completed" | "archive"

function displayServiceTitle(title: string | null | undefined) {
  const cleaned = title?.trim() ?? ""
  if (!cleaned || /^a+$/i.test(cleaned)) return "Unbenannter Service"
  return cleaned
}

export default function MyRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [reviewsByRequest, setReviewsByRequest] = useState<Record<string, Review>>({})
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({})
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [proofDraft, setProofDraft] = useState<Record<string, string>>({})
  const [reviewMessage, setReviewMessage] = useState("")
  const [requestFilter, setRequestFilter] = useState<CustomerRequestFilter>("active")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const statusSteps: Array<ServiceRequest["status"]> = [
    "pending",
    "accepted",
    "completed",
  ]

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
        if (requestFilter === "completed") return status === "completed"
        return ["rejected", "cancelled"].includes(status)
      }),
    [requestFilter, sortedRequests]
  )

  const requestFilters: Array<{ key: CustomerRequestFilter; label: string; count: number }> = [
    {
      key: "active",
      label: "Aktiv",
      count: requests.filter((item) => ["pending", "accepted"].includes(item.status ?? "pending")).length,
    },
    {
      key: "completed",
      label: "Erledigt",
      count: requests.filter((item) => item.status === "completed").length,
    },
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
    setMessage("")
    if (!canCustomerTransition(request.status, nextStatus)) {
      setMessage("Dieser Statuswechsel ist für diese Anfrage nicht mehr möglich.")
      return
    }

    try {
      await updateRequestStatus({
        requestId: request.id,
        nextStatus,
        currentStatus: request.status,
        actorId: currentUserId,
        note:
          nextStatus === "cancelled"
            ? "Vom Kunden zurückgezogen"
            : nextStatus === "deleted"
              ? "Vom Kunden gelöscht"
              : null,
      })
      setRequests((current) =>
        nextStatus === "deleted"
          ? current.filter((item) => item.id !== request.id)
          : current.map((item) =>
              item.id === request.id ? { ...item, status: nextStatus } : item
            )
      )
      setMessage(successMessage)
    } catch {
      setMessage(failureMessage)
    }
  }

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getCustomerDashboardData()
        setCurrentUserId(data.currentUserId)
        setRequests(data.requests)
        setServices(data.services)
        const byRequest: Record<string, Review> = {}
        for (const review of data.reviews) {
          byRequest[review.request_id] = review
        }
        setReviewsByRequest(byRequest)
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Anfragen konnten nicht geladen werden."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadRequests()
  }, [])

  return (
    <main className="readable-page min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl animate-float-up">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow text-sm font-semibold uppercase tracking-wide">
              Kundenbereich
            </p>
            <h1 className="page-title mt-2 text-3xl font-semibold">
              Meine Anfragen
            </h1>
            <p className="page-subtitle mt-2 max-w-2xl text-sm leading-6">
              Verfolge offene Buchungen, chatte mit Anbietern und buche gute Services mit einem Klick erneut.
            </p>
          </div>
          <Link
            href="/services"
            className="btn-primary min-h-11 justify-center px-4 py-2 text-sm font-semibold"
          >
            Dienstleister finden
          </Link>
        </div>
        {message && (
          <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {message}
          </p>
        )}
        {reviewMessage && (
          <p className="mt-2 rounded-[8px] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {reviewMessage}
          </p>
        )}

        {loading && <div className="card-surface mt-6 h-32 animate-pulse rounded-[12px]" />}

        {!loading && requests.length === 0 && (
          <div className="card-surface mt-6 rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
            Du hast noch keine Anfrage gesendet.
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
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
        )}

        {!loading && requests.length > 0 && filteredRequests.length === 0 && (
          <div className="card-surface mt-4 rounded-[12px] p-5 text-slate-600 dark:text-slate-300">
            Keine Anfragen in diesem Bereich.
          </div>
        )}

        <div className="mt-4 space-y-3">
          {filteredRequests.map((request) => {
            const service = services.find((s) => s.id === request.service_id)
            const status = request.status ?? "pending"

            return (
              <div key={request.id} className="card-surface rounded-[12px] p-5">
                <p className="font-semibold text-[var(--card-foreground)]">Service: {displayServiceTitle(service?.title)}</p>
                <p className="request-status-label mt-2 text-sm">
                  Status:{" "}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${statusTone(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {request.customer_budget_eur != null && (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300">
                      Dein Budget: {request.customer_budget_eur} EUR
                    </span>
                  )}
                  {request.provider_offer_eur != null && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      Angebot: {request.provider_offer_eur} EUR
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {statusSteps.map((step) => {
                    const active =
                      request.status === step ||
                      (step === "pending" && ["accepted", "completed"].includes(request.status ?? "")) ||
                      (step === "accepted" && request.status === "completed")
                    return (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full ${
                          active ? "bg-[var(--brand)]" : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    )
                  })}
                </div>
                <div className="panel-muted mt-4 flex flex-wrap gap-2 rounded-[10px] p-3">
                  {canCustomerTransition(status, "cancelled") && (
                    <button
                      type="button"
                      className="action-btn action-warn"
                      onClick={() =>
                        changeStatus(
                          request,
                          "cancelled",
                          "Anfrage wurde zurückgezogen.",
                          "Anfrage konnte nicht zurückgezogen werden."
                        )
                      }
                    >
                      Anfrage zurückziehen
                    </button>
                  )}
                  <button
                    type="button"
                    className="action-btn action-danger"
                    onClick={() => {
                      const confirmed = window.confirm("Anfrage endgültig löschen?")
                      if (!confirmed) return
                      void changeStatus(
                        request,
                        "deleted",
                        "Anfrage wurde gelöscht.",
                        "Anfrage konnte nicht gelöscht werden."
                      )
                    }}
                  >
                    Anfrage löschen
                  </button>
                  <Link href={`/chat/${request.id}`} className="action-ghost">
                    Chat öffnen
                  </Link>
                  {service && (
                    <button
                      type="button"
                      className="action-ghost"
                      onClick={async () => {
                        setMessage("")
                        try {
                          await createServiceRequest({
                            serviceId: service.id,
                            message: `Ich moechte diesen Service erneut anfragen: ${service.title}`,
                            customerBudgetEur: request.customer_budget_eur ?? null,
                          })
                        } catch (error) {
                          setMessage(
                            error instanceof Error
                              ? `Wiederbuchung fehlgeschlagen: ${error.message}`
                              : "Wiederbuchung fehlgeschlagen."
                          )
                          return
                        }
                        setMessage("Wiederbuchung wurde erstellt.")
                      }}
                    >
                      Wiederbuchen
                    </button>
                  )}
                </div>

                {(request.status === "accepted" || request.status === "completed") &&
                  service && (
                    <div className="panel-muted mt-4 rounded-[10px] p-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Bewertung
                      </p>
                      {reviewsByRequest[request.id] ? (
                        <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          <p>Du hast {reviewsByRequest[request.id].rating}/5 Sterne bewertet.</p>
                          <p className="mt-1 text-xs">
                            {reviewsByRequest[request.id].proof_validated
                              ? "Bewertung ist geprüft und sichtbar."
                              : "Bewertung wartet auf Foto-Prüfung durch das Admin-Team."}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((value) => {
                              const current = ratingDraft[request.id] ?? 5
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    setRatingDraft((currentDraft) => ({
                                      ...currentDraft,
                                      [request.id]: value,
                                    }))
                                  }
                                  className={`rounded-[8px] px-2.5 py-1.5 text-xs font-semibold ${
                                    value <= current
                                      ? "bg-[var(--brand)] text-white"
                                      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  {value}
                                </button>
                              )
                            })}
                          </div>
                          <textarea
                            className="field-input mt-2 min-h-20 w-full rounded-[8px] px-3 py-2 text-sm"
                            placeholder="Optionaler Kommentar"
                            value={commentDraft[request.id] ?? ""}
                            onChange={(event) =>
                              setCommentDraft((currentDraft) => ({
                                ...currentDraft,
                                [request.id]: event.target.value,
                              }))
                            }
                          />
                          <textarea
                            className="field-input mt-2 min-h-20 w-full rounded-[8px] px-3 py-2 text-sm"
                            placeholder="Foto-Beweise als Links (https://...), mehrere Zeilen oder Komma-getrennt"
                            value={proofDraft[request.id] ?? ""}
                            onChange={(event) =>
                              setProofDraft((currentDraft) => ({
                                ...currentDraft,
                                [request.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="action-btn action-complete mt-2"
                            onClick={async () => {
                              setReviewMessage("")
                              const rating = ratingDraft[request.id] ?? 5
                              const proofUrls = (proofDraft[request.id] ?? "")
                                .split(/[\n,]/g)
                                .map((item) => item.trim())
                                .filter((item) => /^https?:\/\//i.test(item))

                              if (proofUrls.length === 0) {
                                setReviewMessage(
                                  "Bitte mindestens einen gültigen Foto-Link als Beweis angeben."
                                )
                                return
                              }

                              const response = await authenticatedFetch("/api/reviews", {
                                method: "POST",
                                body: JSON.stringify({
                                  requestId: request.id,
                                  serviceId: service.id,
                                  rating,
                                  comment: (commentDraft[request.id] ?? "").trim() || null,
                                  proofLinks: proofUrls,
                                }),
                              })

                              if (!response.ok) {
                                setReviewMessage(await readApiErrorMessage(response))
                                return
                              }

                              const payload = (await response.json().catch(() => null)) as
                                | { data?: Review }
                                | null
                              const data = payload?.data ?? null

                              if (data) {
                                setReviewsByRequest((current) => ({
                                  ...current,
                                  [request.id]: data as Review,
                                }))
                              }
                              setReviewMessage("Danke, deine Bewertung wurde gespeichert.")
                            }}
                          >
                            Bewertung speichern
                          </button>
                        </>
                      )}
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
