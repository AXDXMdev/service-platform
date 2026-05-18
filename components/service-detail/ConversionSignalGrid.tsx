type ConversionSignal = {
  label: string
  value: string
  helper: string
  strong?: boolean
}

type ConversionSignalGridProps = {
  responseTimeMinutes?: number | null
  responseRatePercent?: number | null
  completedJobsCount?: number | null
  repeatCustomerRatePercent?: number | null
  lastActiveAt?: string | null
  ratingAverage?: number | null
  ratingCount?: number
}

function formatResponseTime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "Noch keine Daten"
  if (minutes < 60) return `< ${Math.ceil(minutes)} Min.`
  return `< ${Math.ceil(minutes / 60)} Std.`
}

function formatPercent(value?: number | null) {
  if (value == null || value < 0) return "Noch keine Daten"
  return `${Math.round(value)}%`
}

function formatLastActive(value?: string | null) {
  if (!value) return "Noch nicht sichtbar"
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return "Noch nicht sichtbar"
  const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
  if (diffDays === 0) return "Heute aktiv"
  if (diffDays === 1) return "Gestern aktiv"
  if (diffDays < 30) return `Vor ${diffDays} Tagen aktiv`
  return "Laenger nicht aktiv"
}

export default function ConversionSignalGrid({
  responseTimeMinutes,
  responseRatePercent,
  completedJobsCount,
  repeatCustomerRatePercent,
  lastActiveAt,
  ratingAverage,
  ratingCount = 0,
}: ConversionSignalGridProps) {
  const signals: ConversionSignal[] = [
    {
      label: "Antwortzeit",
      value: formatResponseTime(responseTimeMinutes),
      helper: responseTimeMinutes ? "Aus echten Anbieterantworten berechnet" : "Wird nach ersten Antworten berechnet",
      strong: Boolean(responseTimeMinutes && responseTimeMinutes <= 60),
    },
    {
      label: "Antwortquote",
      value: formatPercent(responseRatePercent),
      helper: responseRatePercent != null ? "Anteil beantworteter Anfragen" : "Noch nicht genug Anfragen",
      strong: Boolean(responseRatePercent && responseRatePercent >= 80),
    },
    {
      label: "Abgeschlossene Jobs",
      value: completedJobsCount != null ? String(completedJobsCount) : "Noch keine Daten",
      helper: completedJobsCount ? "Nur abgeschlossene Hilfinio-Auftraege" : "Wird nach Auftragsabschluss sichtbar",
      strong: Boolean(completedJobsCount && completedJobsCount >= 5),
    },
    {
      label: "Wiederbuchung",
      value: formatPercent(repeatCustomerRatePercent),
      helper: repeatCustomerRatePercent != null ? "Aus wiederkehrenden Kunden berechnet" : "Noch nicht genug Verlauf",
      strong: Boolean(repeatCustomerRatePercent && repeatCustomerRatePercent >= 30),
    },
    {
      label: "Zuletzt aktiv",
      value: formatLastActive(lastActiveAt),
      helper: lastActiveAt ? "Aus letzter Plattformaktivitaet" : "Aktivitaetsanzeige noch nicht freigegeben",
    },
    {
      label: "Bewertung",
      value: ratingAverage != null ? `${ratingAverage}/5` : "Neu",
      helper: ratingCount > 0 ? `${ratingCount} verifizierte Bewertungen` : "Noch keine verifizierten Bewertungen",
      strong: Boolean(ratingAverage && ratingAverage >= 4.7 && ratingCount >= 3),
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Anbieter Kennzahlen">
      {signals.map((signal) => (
        <div
          key={signal.label}
          className={`rounded-[12px] border p-4 ${
            signal.strong
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-[var(--surface-border)] bg-[var(--surface-muted)]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {signal.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {signal.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {signal.helper}
          </p>
        </div>
      ))}
    </section>
  )
}
