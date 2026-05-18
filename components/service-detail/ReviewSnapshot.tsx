type ReviewSnapshotProps = {
  ratingAverage?: number | null
  ratingCount?: number
}

const dimensions = [
  "Kommunikation",
  "Qualitaet",
  "Puenktlichkeit",
  "Preis-Leistung",
]

export default function ReviewSnapshot({
  ratingAverage = null,
  ratingCount = 0,
}: ReviewSnapshotProps) {
  const hasReviews = ratingAverage != null && ratingCount > 0

  return (
    <section className="card-surface rounded-[14px] p-5" aria-labelledby="reviews-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Bewertungen
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Nur abgeschlossene Auftraege koennen perspektivisch bewertet werden.
          </p>
        </div>
        <div className="rounded-[12px] bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          {hasReviews ? `${ratingAverage}/5 aus ${ratingCount} Reviews` : "Noch keine verifizierten Reviews"}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {dimensions.map((dimension) => (
          <div key={dimension} className="panel-muted rounded-[10px] p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{dimension}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {hasReviews ? "Wird berechnet" : "Noch nicht genug Daten"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[12px] border border-[var(--surface-border)] bg-white/70 p-4 dark:bg-slate-950/50">
        <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
          Review-Highlights
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {hasReviews
            ? "Detailauswertungen und Foto-Reviews werden angezeigt, sobald strukturierte Review-Daten vorliegen."
            : "AI-Zusammenfassung, Foto-Reviews und Unterkategorien erscheinen erst ab mehreren verifizierten Buchungen."}
        </p>
      </div>
    </section>
  )
}
