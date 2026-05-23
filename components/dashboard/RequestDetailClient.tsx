"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ChatMessage, Review, Service, ServiceRequest } from "@/app/types"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import { getRequestDetailData, markRequestRead } from "@/lib/dashboardApi"
import {
  canCustomerTransition,
  canProviderTransition,
  statusLabel,
  statusTone,
  type RequestStatus,
  updateRequestStatus,
} from "@/lib/requestWorkflow"
import { normalizeText } from "@/lib/validation"

type RequestRole = "customer" | "provider"

function formatDate(value?: string | null) {
  if (!value) return "Nicht angegeben"
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function isReadOnly(status: string | null | undefined) {
  return ["completed", "cancelled", "declined", "rejected", "deleted"].includes(status ?? "")
}

export default function RequestDetailClient({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [role, setRole] = useState<RequestRole | null>(null)
  const [currentUserId, setCurrentUserId] = useState("")
  const [review, setReview] = useState<Review | null>(null)
  const [draft, setDraft] = useState("")
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [proofLinks, setProofLinks] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const status = request?.status ?? "pending"
  const canWrite = request ? !isReadOnly(status) : false
  const canReview = role === "customer" && status === "completed" && !review

  const load = async () => {
    setError("")
    setLoading(true)
    try {
      const data = await getRequestDetailData(requestId)
      setCurrentUserId(data.currentUserId)
      setRole(data.role)
      setRequest(data.request)
      setService(data.service)
      setMessages(data.messages)
      setReview(data.review)
      await markRequestRead(requestId).catch(() => undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Anfrage konnte nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getRequestDetailData(requestId)
      .then(async (data) => {
        if (!active) return
        setCurrentUserId(data.currentUserId)
        setRole(data.role)
        setRequest(data.request)
        setService(data.service)
        setMessages(data.messages)
        setReview(data.review)
        await markRequestRead(requestId).catch(() => undefined)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Anfrage konnte nicht geladen werden.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [requestId])

  const actionButtons = useMemo(() => {
    if (!request || !role) return []
    const actions: Array<{ status: RequestStatus; label: string; tone: string; note?: string }> = []
    if (role === "provider") {
      if (canProviderTransition(status, "accepted")) {
        actions.push({ status: "accepted", label: "Annehmen", tone: "action-complete" })
      }
      if (canProviderTransition(status, "declined")) {
        actions.push({ status: "declined", label: "Ablehnen", tone: "action-danger", note: "Vom Anbieter abgelehnt" })
      }
      if (canProviderTransition(status, "completed")) {
        actions.push({ status: "completed", label: "Als abgeschlossen markieren", tone: "action-complete" })
      }
    }
    if (role === "customer" && canCustomerTransition(status, "cancelled")) {
      actions.push({ status: "cancelled", label: "Anfrage abbrechen", tone: "action-warn", note: "Vom Kunden abgebrochen" })
    }
    return actions
  }, [request, role, status])

  const changeStatus = async (nextStatus: RequestStatus, note?: string | null) => {
    if (!request) return
    setBusy(true)
    setNotice("")
    try {
      await updateRequestStatus({
        requestId: request.id,
        nextStatus,
        currentStatus: request.status,
        actorId: currentUserId,
        note,
      })
      setRequest((current) => (current ? { ...current, status: nextStatus } : current))
      setNotice("Status wurde aktualisiert.")
      await load()
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : "Aktion fehlgeschlagen.")
    } finally {
      setBusy(false)
    }
  }

  const sendMessage = async () => {
    const text = normalizeText(draft, 1500)
    if (!text) return
    setBusy(true)
    setNotice("")
    try {
      const response = await authenticatedFetch(`/api/requests/${requestId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      })
      if (!response.ok) throw new Error(await readApiErrorMessage(response))
      const payload = (await response.json()) as { data: ChatMessage }
      setMessages((current) => [...current, payload.data])
      setDraft("")
    } catch (sendError) {
      setNotice(sendError instanceof Error ? sendError.message : "Nachricht konnte nicht gesendet werden.")
    } finally {
      setBusy(false)
    }
  }

  const submitReview = async () => {
    if (!request || !service) return
    const links = proofLinks
      .split(/[\n,]/g)
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item))
    if (links.length === 0) {
      setNotice("Bitte mindestens einen gültigen Foto-Link als Nachweis angeben.")
      return
    }
    setBusy(true)
    try {
      const response = await authenticatedFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          requestId: request.id,
          serviceId: service.id,
          rating,
          comment: reviewComment.trim() || null,
          proofLinks: links,
        }),
      })
      if (!response.ok) throw new Error(await readApiErrorMessage(response))
      const payload = (await response.json()) as { data: Review }
      setReview(payload.data)
      setNotice("Bewertung wurde gespeichert.")
    } catch (reviewError) {
      setNotice(reviewError instanceof Error ? reviewError.message : "Bewertung konnte nicht gespeichert werden.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="readable-page min-h-screen px-4 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="card-surface h-28 animate-pulse rounded-[14px]" />
          <div className="card-surface h-[440px] animate-pulse rounded-[14px]" />
        </div>
      </main>
    )
  }

  if (error || !request || !service || !role) {
    return (
      <main className="readable-page min-h-screen px-4 py-6 sm:px-8 lg:px-12">
        <div className="card-surface mx-auto max-w-xl rounded-[14px] p-6 text-center">
          <h1 className="text-xl font-semibold">Anfrage nicht verfügbar</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error || "Diese Anfrage konnte nicht geladen werden."}</p>
          <button type="button" className="action-ghost mt-4" onClick={() => void load()}>
            Erneut versuchen
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="readable-page min-h-screen px-4 pb-28 pt-5 sm:px-8 lg:px-12 lg:pb-10">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="card-surface h-fit rounded-[14px] p-5 lg:sticky lg:top-24">
          <Link href="/dashboard/inbox" className="text-sm font-semibold text-[var(--brand)] hover:underline">
            Zur Inbox
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusTone(status)}`}>
              {statusLabel(status)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {role === "provider" ? "Anbieteransicht" : "Kundenansicht"}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-100">{service.title}</h1>
          <dl className="mt-5 space-y-3 text-sm">
            {[
              ["Wunschzeitraum", request.preferred_date],
              ["Ort", request.request_location],
              ["Budget", request.customer_budget_eur != null ? `${request.customer_budget_eur} EUR` : null],
              ["Kontakt", request.contact_preference],
              ["Erstellt", formatDate(request.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="panel-muted rounded-[10px] p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{value || "Nicht angegeben"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            {actionButtons.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={busy}
                className={`action-btn ${action.tone} justify-center`}
                onClick={() => void changeStatus(action.status, action.note ?? null)}
              >
                {action.label}
              </button>
            ))}
            <Link href={`/report?target=${encodeURIComponent(`/dashboard/requests/${request.id}`)}`} className="action-ghost justify-center">
              Problem melden
            </Link>
          </div>
        </aside>

        <section className="card-surface flex min-h-[70vh] flex-col overflow-hidden rounded-[14px]">
          <div className="border-b border-[var(--surface-border)] p-4">
            <h2 className="font-semibold text-slate-950 dark:text-slate-100">Chat und Verlauf</h2>
            {notice && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notice}</p>}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="panel-muted rounded-[12px] p-4 text-sm text-slate-600 dark:text-slate-300">
                Noch keine Nachrichten. Schreibe eine klare, sichere Nachricht ohne sensible Daten.
              </div>
            )}
            {messages.map((message) => {
              const mine = message.sender_id === currentUserId
              const text = message.body || message.message
              return (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-[14px] px-4 py-3 text-sm shadow-sm ${
                    mine
                      ? "ml-auto bg-[var(--brand)] text-white"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  } ${message.system_event_type ? "mx-auto max-w-full bg-amber-500/10 text-amber-800 dark:text-amber-200" : ""}`}
                >
                  {message.system_event_type && <p className="mb-1 text-xs font-semibold uppercase">System</p>}
                  <p className="whitespace-pre-wrap">{text}</p>
                  <p className="mt-1 text-[11px] opacity-75">{formatDate(message.created_at)}</p>
                </div>
              )
            })}
          </div>

          {canReview && (
            <div className="border-t border-[var(--surface-border)] bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Auftrag bewerten</p>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-[8px] px-3 py-2 text-sm font-semibold ${value <= rating ? "bg-[var(--brand)] text-white" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
                    onClick={() => setRating(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea className="field-input mt-2 min-h-20 w-full rounded-[10px] px-3 py-2" placeholder="Optionaler Kommentar" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
              <textarea className="field-input mt-2 min-h-20 w-full rounded-[10px] px-3 py-2" placeholder="Foto-Nachweise als https:// Links" value={proofLinks} onChange={(event) => setProofLinks(event.target.value)} />
              <button type="button" className="action-btn action-complete mt-2" disabled={busy} onClick={() => void submitReview()}>
                Bewertung speichern
              </button>
            </div>
          )}

          {review && (
            <div className="border-t border-[var(--surface-border)] bg-slate-50 p-4 text-sm dark:bg-slate-900/60">
              Bewertung gespeichert: {review.rating}/5 Sterne
            </div>
          )}

          <form
            className="sticky bottom-0 border-t border-[var(--surface-border)] bg-white/95 p-3 backdrop-blur dark:bg-slate-950/95"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
            {canWrite ? (
              <div className="flex gap-2">
                <label htmlFor="request-message" className="sr-only">Nachricht</label>
                <textarea
                  id="request-message"
                  className="field-input max-h-32 min-h-12 flex-1 resize-none rounded-[12px] px-3 py-3"
                  placeholder="Nachricht schreiben..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={busy || !draft.trim()} className="btn-primary min-h-12 self-end px-5 py-3 text-sm font-semibold">
                  Senden
                </button>
              </div>
            ) : (
              <p className="rounded-[10px] bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Diese Anfrage ist abgeschlossen oder archiviert. Der Verlauf bleibt lesbar.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
