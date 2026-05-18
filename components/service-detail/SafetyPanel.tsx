import Link from "next/link"

export default function SafetyPanel() {
  return (
    <section className="card-surface rounded-[14px] p-5" aria-labelledby="safety-heading">
      <h2 id="safety-heading" className="text-lg font-semibold text-slate-950 dark:text-slate-100">
        Sicher ueber Hilfinio anfragen
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Keine sensiblen Daten zu frueh teilen",
            text: "Adresse, Zahlungsdaten und Dokumente erst teilen, wenn der Auftrag plausibel ist.",
          },
          {
            title: "Chat-Verlauf bleibt nachvollziehbar",
            text: "Anfragen und Antworten werden im Hilfinio-Flow dokumentiert.",
          },
          {
            title: "Missbrauch melden",
            text: "Auffaellige Profile, Spam oder Drucksituationen koennen gemeldet werden.",
          },
        ].map((item) => (
          <div key={item.title} className="panel-muted rounded-[12px] p-4">
            <p className="font-semibold text-slate-950 dark:text-slate-100">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>
      <Link href="/report" className="mt-4 inline-flex text-sm font-semibold text-[var(--brand)] hover:underline">
        Problem oder Missbrauch melden
      </Link>
    </section>
  )
}
