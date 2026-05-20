import PageContentHeader from "@/components/PageContentHeader"
import { LEGAL_LAST_UPDATED, LEGAL_NOTES, hasVsbgStatus } from "@/lib/legal"

export default function AgbPage() {
  const resolvedVsbgStatus = hasVsbgStatus()

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <PageContentHeader
            slug="agb"
            fallbackTitle="Allgemeine Geschäftsbedingungen"
            fallbackSubtitle={`Stand: ${LEGAL_LAST_UPDATED}. Diese Bedingungen regeln die Nutzung von Hilfinio als Vermittlungs- und Kommunikationsplattform.`}
          />
        </section>

        <section className="card-surface mt-6 rounded-[14px] p-7 text-sm leading-7 text-slate-800 dark:text-slate-200">
          {!resolvedVsbgStatus ? (
            <div className="mb-6 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">TODO_LEGAL_REVIEW</p>
              <p>{LEGAL_NOTES.missingVsbgStatus}</p>
            </div>
          ) : null}
          <div className="mb-6 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-semibold">TODO_LEGAL_REVIEW</p>
            <p>{LEGAL_NOTES.legalReview}</p>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                1. Geltungsbereich
              </h2>
              <p className="mt-2">
                Diese AGB gelten für die Nutzung der Plattform Hilfinio durch registrierte
                und nicht registrierte Nutzer, insbesondere Kunden, Anbieter und sonstige
                Interessenten.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                2. Rolle von Hilfinio
              </h2>
              <p className="mt-2">
                Hilfinio stellt eine technische Plattform bereit, über die Kunden und
                Anbieter miteinander in Kontakt treten, Anfragen austauschen und Leistungen
                anbahnen können.
              </p>
              <p className="mt-2">
                Hilfinio wird selbst nicht Vertragspartner der zwischen Kunden und Anbietern
                geschlossenen Dienstleistungsverträge, schuldet nicht deren Erfüllung und
                übernimmt keine Inkasso-, Gewährleistungs- oder Erfolgsgarantie für die
                vermittelte Leistung, sofern im Einzelfall nichts Abweichendes ausdrücklich
                vereinbart wurde.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                3. Registrierung und Nutzerkonto
              </h2>
              <p className="mt-2">
                Für bestimmte Funktionen ist ein Nutzerkonto erforderlich. Nutzer müssen
                zutreffende, aktuelle und vollständige Angaben machen und ihre Zugangsdaten
                geheim halten.
              </p>
              <p className="mt-2">
                Ein Anspruch auf Registrierung oder dauerhafte Nutzung der Plattform besteht
                nicht.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                4. Anbieterpflichten
              </h2>
              <p className="mt-2">
                Anbieter dürfen nur rechtmäßige und tatsächlich verfügbare Leistungen
                einstellen. Sie sind für die Richtigkeit ihrer Angaben, das Vorliegen
                erforderlicher Qualifikationen, Gewerbe- oder Berufszulassungen sowie für die
                Einhaltung steuerlicher, berufsrechtlicher und verbraucherschutzrechtlicher
                Pflichten selbst verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                5. Anfragen, Kommunikation und Vertragsabschluss
              </h2>
              <p className="mt-2">
                Kunden können über Hilfinio Anfragen an Anbieter stellen. Ein Vertrag kommt
                ausschließlich zwischen Kunde und Anbieter zustande, wenn beide sich über die
                konkreten Vertragsbedingungen einigen. Hilfinio ist an diesem Vertragsschluss
                nicht beteiligt.
              </p>
              <p className="mt-2">
                Nutzer sind verpflichtet, im Rahmen der Kommunikation keine rechtswidrigen,
                beleidigenden, diskriminierenden, irreführenden oder missbräuchlichen
                Inhalte zu übermitteln.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                6. Verifizierungshinweis
              </h2>
              <p className="mt-2">
                Ein Verifizierungsstatus bedeutet ausschließlich, dass Hilfinio bestimmte
                Nachweise oder Angaben zum Zeitpunkt der Prüfung gesichtet hat. Der Status ist
                keine Zusicherung der fachlichen Qualität, Bonität, Zuverlässigkeit,
                Rechtmäßigkeit oder fortbestehenden Berechtigung eines Anbieters.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                7. Inhalte, Bewertungen und Moderation
              </h2>
              <p className="mt-2">
                Hilfinio kann Inhalte und Bewertungen nach billigem Ermessen prüfen,
                einschränken, ausblenden oder entfernen, wenn konkrete Hinweise auf
                Rechtsverstöße, Irreführung, Missbrauch, Sicherheitsrisiken oder
                Verstöße gegen diese AGB vorliegen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                8. Sperrung, Einschränkung und Kündigung
              </h2>
              <p className="mt-2">
                Hilfinio kann Konten oder einzelne Inhalte vorübergehend oder dauerhaft
                einschränken, wenn ein sachlicher Grund vorliegt, insbesondere bei
                Missbrauch, Umgehung von Sicherheitsmechanismen, falschen Angaben,
                Rechtsverletzungen, ausbleibender Mitwirkung im Verifizierungsprozess oder zur
                Abwehr konkreter Risiken für andere Nutzer oder die Plattform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                9. Verfügbarkeit
              </h2>
              <p className="mt-2">
                Hilfinio bemüht sich um eine möglichst hohe Verfügbarkeit. Eine jederzeit
                störungsfreie und unterbrechungslose Verfügbarkeit wird jedoch nicht
                geschuldet. Wartungen, Sicherheitsupdates, technische Störungen oder
                Umstellungen können die Nutzbarkeit zeitweise einschränken.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                10. Haftung
              </h2>
              <p className="mt-2">
                Hilfinio haftet unbeschränkt bei Vorsatz, grober Fahrlässigkeit, bei
                Verletzung von Leben, Körper oder Gesundheit sowie nach zwingenden
                gesetzlichen Vorschriften.
              </p>
              <p className="mt-2">
                Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die
                Haftung auf den vertragstypisch vorhersehbaren Schaden begrenzt. Im Übrigen
                ist die Haftung für leicht fahrlässige Pflichtverletzungen ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                11. Verbraucherstreitbeilegung
              </h2>
              <p className="mt-2">{LEGAL_NOTES.disputeResolution}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {LEGAL_NOTES.odrDiscontinued}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                12. Schlussbestimmungen
              </h2>
              <p className="mt-2">
                Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts, soweit dem keine
                zwingenden Verbraucherschutzvorschriften des Staates entgegenstehen, in dem der
                Verbraucher seinen gewöhnlichen Aufenthalt hat.
              </p>
              <p className="mt-2">{LEGAL_NOTES.germanVersionAuthoritative}</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
