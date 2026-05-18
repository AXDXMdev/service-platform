"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Service } from "@/app/types"
import { getInboxData } from "@/lib/dashboardApi"
import { statusLabel, statusTone, type RequestStatus } from "@/lib/requestWorkflow"
import type { InboxRequestSummary } from "@/services/inboxService"

type InboxFilter = "all" | "pending" | "accepted" | "completed" | "declined"
type InboxSort = "newest" | "unanswered" | "urgent"

function timeAgo(value?: string | null) {
  if (!value) return "gerade eben"
  const diff = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(diff) || diff < 60_000) return "gerade eben"
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tagen`
}

function normalizedStatus(status: string | null | undefined) {
  if (status === "rejected") return "declined"
  return (status ?? "pending") as RequestStatus
}

function lastActivity(request: InboxRequestSummary) {
  return request.last_message?.created_at ?? request.updated_at ?? request.created_at ?? null
}

function serviceTitle(services: Service[], serviceId: string) {
  return services.find((service) => service.id === serviceId)?.title ?? "Unbenannter Service"
}

export default function RequestInboxClient() {
  const [requests, setRequests] = useState<InboxRequestSummary[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filter, setFilter] = useState<InboxFilter>("all")
  const [sort, setSort] = useState<InboxSort>("newest")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    setLoading(true)
    try {
      const data = await getInboxData()
      setRequests(data.requests)
      setServices(data.services)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Inbox konnte nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getInboxData()
      .then((data) => {
        if (!active) return
        setRequests(data.requests)
        setServices(data.services)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Inbox konnte nicht geladen werden.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const tabs: Array<{ key: InboxFilter; label: string; count: number }> = [
    { key: "all", label: "Alle", count: requests.length },
    { key: "pending", label: "Offen", count: requests.filter((item) => normalizedStatus(item.status) === "pending").length },
    { key: "accepted", label: "Angenommen", count: requests.filter((item) => normalizedStatus(item.status) === "accepted").length },
    { key: "completed", label: "Abgeschlossen", count: requests.filter((item) => normalizedStatus(item.status) === "completed").length },
    { key: "declined", label: "Abgelehnt", count: requests.filter((item) => ["declined", "cancelled"].includes(normalizedStatus(item.status))).length },
  ]

  const visibleRequests = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [...requests]
      .filter((request) => {
        const status = normalizedStatus(request.status)
        if (filter === "declined" && !["declined", "cancelled"].includes(status)) return false
        if (filter !== "all" && filter !== "declined" && status !== filter) return false
        if (!term) return true
        const title = serviceTitle(services, request.service_id).toLowerCase()
        const text = `${title} ${request.first_message ?? ""} ${request.last_message?.body ?? request.last_message?.message ?? ""}`.toLowerCase()
        return text.includes(term)
      })
      .sort((a, b) => {
        if (sort === "unanswered") {
          const unreadDiff = b.unread_count - a.unread_count
          if (unreadDiff !== 0) return unreadDiff
          const pendingDiff = Number(normalizedStatus(b.status) === "pending") - Number(normalizedStatus(a.status) === "pending")
          if (pendingDiff !== 0) return pendingDiff
        }
        if (sort === "urgent") {
          const urgentDiff =
            Number(normalizedStatus(b.status) === "pending" && b.role === "provider") -
            Number(normalizedStatus(a.status) === "pending" && a.role === "provider")
          if (urgentDiff !== 0) return urgentDiff
        }
        return new Date(lastActivity(b) ?? 0).getTime() - new Date(lastActivity(a) ?? 0).getTime()
      })
  }, [filter, query, requests, services, sort])

  return (
    <main className="readable-page min-h-screen px-4 pb-10 pt-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="page-eyebrow text-sm font-semibold uppercase tracking-wide">Inbox</p>
            <h1 className="page-title mt-2 text-3xl font-semibold">Anfragen verwalten</h1>
            <p className="page-subtitle mt-2 max-w-2xl text-sm leading-6">
              Alle Kunden- und Anbieteranfragen an einem Ort: antworten, annehmen, abschliessen und bewerten.
            </p>
          </div>
          <Link href="/services" className="btn-primary min-h-11 justify-center px-4 py-2 text-sm font-semibold">
            Service finden
          </Link>
        </div>

        <section className="card-surface mt-6 rounded-[14px] p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <label className="sr-only" htmlFor="inbox-search">Anfragen suchen</label>
            <input
              id="inbox-search"
              className="field-input min-h-11 rounded-[10px] px-3"
              placeholder="Suche nach Service, Nachricht oder Status..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <label className="sr-only" htmlFor="inbox-sort">Sortierung</label>
            <select
              id="inbox-sort"
              className="field-input min-h-11 rounded-[10px] px-3"
              value={sort}
              onChange={(event) => setSort(event.target.value as InboxSort)}
            >
              <option value="newest">Neueste Aktivitaet</option>
              <option value="unanswered">Ungelesen zuerst</option>
              <option value="urgent">Dringend zuerst</option>
            </select>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === tab.key
                    ? "bg-[var(--brand)] text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="card-surface mt-4 rounded-[12px] p-4">
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            <button type="button" className="action-ghost mt-3" onClick={() => void load()}>
              Erneut versuchen
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="card-surface h-32 animate-pulse rounded-[14px]" />
            ))}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="card-surface mt-4 rounded-[14px] p-6 text-center">
            <h2 className="text-lg font-semibold">Noch keine Anfragen</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Sobald du Services kontaktierst oder Kunden dich anfragen, erscheint hier deine Inbox.
            </p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && visibleRequests.length === 0 && (
          <div className="card-surface mt-4 rounded-[14px] p-6 text-center">
            <h2 className="text-lg font-semibold">Keine Treffer</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Fuer diesen Filter gibt es gerade keine passenden Anfragen.
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {visibleRequests.map((request) => {
            const title = serviceTitle(services, request.service_id)
            const status = normalizedStatus(request.status)
            const preview = request.last_message?.body || request.last_message?.message || request.first_message || "Noch keine Nachricht."
            return (
              <Link
                key={request.id}
                href={`/dashboard/requests/${request.id}`}
                className="card-surface interactive-card block rounded-[14px] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusTone(status)}`}>
                        {statusLabel(status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {request.role === "provider" ? "Anbieter" : "Kunde"}
                      </span>
                      {request.unread_count > 0 && (
                        <span className="rounded-full bg-[var(--brand)] px-2.5 py-1 text-xs font-semibold text-white">
                          {request.unread_count} ungelesen
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 truncate text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {preview}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {timeAgo(lastActivity(request))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
