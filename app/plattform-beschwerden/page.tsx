import Link from "next/link"
import type { Metadata } from "next"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Plattform-Beschwerden und DSA-Meldeweg",
  description:
    "Der Hilfinio-Meldeweg für rechtswidrige Inhalte, Missbrauch, Datenschutzprobleme und Beschwerden gegen Plattformentscheidungen.",
  path: "/plattform-beschwerden",
})

export default function PlatformComplaintsPage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
            Plattform-Beschwerden und DSA-Meldeweg
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Hilfinio stellt einen internen Melde- und Beschwerdeweg für Hinweise auf
            rechtswidrige Inhalte, Betrug, Missbrauch, Datenschutzprobleme und vergleichbare
            Plattformvorfälle bereit.
          </p>
          <p className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            TODO_LEGAL_REVIEW: Melde- und Beschwerdeprozess nach DSA, Fristen und
            Zuständigkeiten vor dem öffentlichen Launch final juristisch prüfen lassen.
          </p>

          <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                1. Was kann gemeldet werden?
              </h2>
              <p>
                Insbesondere rechtswidrige Inhalte, irreführende Angebote, Betrugsverdacht,
                Belästigung, Datenschutzprobleme und fehlerhafte Plattformentscheidungen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                2. Wie funktioniert die Meldung?
              </h2>
              <p>
                Über das Formular unter{" "}
                <Link href="/report" className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline">
                  /report
                </Link>{" "}
                kannst du die betroffene URL oder ID, die Kategorie des Problems und eine
                konkrete Beschreibung übermitteln.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                3. Interne Bearbeitung
              </h2>
              <p>
                Meldungen werden intern geprüft, priorisiert und dokumentiert. Hilfinio kann
                Inhalte sperren, Nutzerkonten einschränken, Nachweise anfordern oder
                Meldungen als unbegründet zurückweisen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                4. Beschwerde gegen Plattformentscheidungen
              </h2>
              <p>
                Wenn du eine Moderations- oder Einschränkungsentscheidung für falsch hältst,
                kannst du dieselbe Seite ebenfalls für eine begründete Beschwerde nutzen und
                dabei auf die betroffene URL, Anfrage, Nachricht oder das Profil verweisen.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
