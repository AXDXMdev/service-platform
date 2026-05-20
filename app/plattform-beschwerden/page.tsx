import Link from "next/link"

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
            Plattformvorfaelle bereit.
          </p>

          <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                1. Was kann gemeldet werden?
              </h2>
              <p>
                Insbesondere rechtswidrige Inhalte, irrefuehrende Angebote, Betrugsverdacht,
                Belaestigung, Datenschutzprobleme und fehlerhafte Plattformentscheidungen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                2. Wie funktioniert die Meldung?
              </h2>
              <p>
                Ueber das Formular unter{" "}
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
                Inhalte sperren, Nutzerkonten einschraenken, Nachweise anfordern oder
                Meldungen als unbegründet zurückweisen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                4. Beschwerde gegen Plattformentscheidungen
              </h2>
              <p>
                Wenn du eine Moderations- oder Einschraenkungsentscheidung für falsch haeltst,
                kannst du dieselbe Seite ebenfalls für eine begruendete Beschwerde nutzen und
                dabei auf die betroffene URL, Anfrage, Nachricht oder das Profil verweisen.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
