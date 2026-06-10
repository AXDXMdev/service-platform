"use client"

import Link from "next/link"
import type { AdminOpsPayload } from "@/app/admin/adminOpsApi"
import type { RequestSlaTone } from "@/services/adminOpsService"

type AdminMarketplaceOpsModuleProps = {
  ops: AdminOpsPayload | null
  loading: boolean
  error: string
  onRefresh: () => void
}

function toneClasses(tone: RequestSlaTone) {
  switch (tone) {
    case "lost":
      return "border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-300"
    case "critical":
      return "border-orange-500/35 bg-orange-500/10 text-orange-800 dark:text-orange-300"
    case "watch":
      return "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300"
    default:
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
  }
}

function toneLabel(tone: RequestSlaTone) {
  switch (tone) {
    case "lost":
      return "Verloren-Risiko"
    case "critical":
      return "4h gerissen"
    case "watch":
      return "Beobachten"
    default:
      return "Innerhalb SLA"
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "n/a"
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function MetricCard({
  label,
  value,
  help,
  danger,
}: {
  label: string
  value: string | number
  help: string
  danger?: boolean
}) {
  return (
    <div className={`rounded-[12px] border p-4 ${danger ? "border-rose-500/30 bg-rose-500/8" : "border-[var(--surface-border)] bg-[var(--surface-muted)]"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{help}</p>
    </div>
  )
}

export function AdminMarketplaceOpsModule({
  ops,
  loading,
  error,
  onRefresh,
}: AdminMarketplaceOpsModuleProps) {
  const marketplace = ops?.marketplace
  const sla = marketplace?.sla

  return (
    <section className="card-surface rounded-[14px] p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">Marketplace Ops</p>
          <h2 className="mt-1 text-2xl font-semibold">Unbeantwortete Requests & 4h-SLA</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Diese Ansicht ist für die tägliche Rettung von Requests: Anbieter erinnern, manuell neu zuweisen,
            tote Profile erkennen.
          </p>
        </div>
        <button type="button" className="action-ghost shrink-0" onClick={onRefresh} disabled={loading}>
          {loading ? "Lädt..." : "Ops aktualisieren"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-[10px] bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      {!marketplace && !error && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-[12px] bg-slate-200/80 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {marketplace && sla && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Unbeantwortet"
              value={sla.openUnanswered}
              help="Aktive Requests ohne Anbieterantwort."
              danger={sla.openUnanswered > 0}
            />
            <MetricCard
              label="4h gerissen"
              value={sla.critical}
              help="Sofort erinnern oder neu zuweisen."
              danger={sla.critical > 0}
            />
            <MetricCard
              label="Verloren-Risiko"
              value={sla.lost}
              help="Älter als 24h ohne Antwort."
              danger={sla.lost > 0}
            />
            <MetricCard
              label="4h Quote 7d"
              value={sla.responseRate4hLast7d == null ? "n/a" : `${sla.responseRate4hLast7d}%`}
              help={`${sla.answeredWithin4hLast7d}/${sla.recentRequestCount} Requests.`}
              danger={(sla.responseRate4hLast7d ?? 100) < 70}
            />
            <MetricCard
              label="Watch"
              value={sla.watch}
              help="1-4h offen, jetzt nachfassen."
              danger={sla.watch > 0}
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950 dark:text-slate-100">Requests nach Alter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stand: {formatDate(marketplace.generatedAt)}
                </p>
              </div>
              <div className="mt-3 space-y-3">
                {marketplace.unansweredRequests.length === 0 && (
                  <p className="panel-muted rounded-[10px] px-3 py-3 text-sm text-slate-700 dark:text-slate-300">
                    Keine unbeantworteten aktiven Requests. Genau so soll es sein.
                  </p>
                )}
                {marketplace.unansweredRequests.slice(0, 12).map((request) => (
                  <article key={request.id} className="panel-muted rounded-[12px] p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(request.slaTone)}`}>
                            {toneLabel(request.slaTone)} · {request.ageHours}h
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {request.status}
                          </span>
                        </div>
                        <h4 className="mt-3 truncate font-semibold text-slate-950 dark:text-slate-100">
                          {request.serviceTitle}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Anbieter: {request.providerName} · {request.providerCity ?? "Stadt unbekannt"}
                        </p>
                        {request.firstMessagePreview && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                            {request.firstMessagePreview}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Aktion: {request.recommendedAction}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 text-sm">
                        <Link className="action-ghost justify-center" href={`/dashboard/requests/${request.id}`}>
                          Request öffnen
                        </Link>
                        {request.customerEmail && (
                          <a className="action-ghost justify-center" href={`mailto:${request.customerEmail}`}>
                            Kunde mailen
                          </a>
                        )}
                      </div>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Erstellt</dt>
                        <dd>{formatDate(request.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Ort</dt>
                        <dd>{request.requestLocation ?? "n/a"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Budget</dt>
                        <dd>{request.budgetEur == null ? "n/a" : `${request.budgetEur} EUR`}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>

            <aside>
              <h3 className="font-semibold text-slate-950 dark:text-slate-100">Anbieter-Risiko</h3>
              <div className="mt-3 space-y-3">
                {marketplace.providerRisks.length === 0 && (
                  <p className="panel-muted rounded-[10px] px-3 py-3 text-sm text-slate-700 dark:text-slate-300">
                    Keine auffälligen Anbieter.
                  </p>
                )}
                {marketplace.providerRisks.slice(0, 8).map((provider) => (
                  <div key={provider.providerId} className="panel-muted rounded-[12px] p-3">
                    <p className="font-semibold text-slate-950 dark:text-slate-100">{provider.providerName}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {provider.unansweredCount} offen · {provider.criticalCount} kritisch · ältester {provider.oldestAgeHours}h
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {provider.serviceTitles.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
