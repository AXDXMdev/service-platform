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
            fallbackTitle="Allgemeine Geschaeftsbedingungen"
            fallbackSubtitle={`Stand: ${LEGAL_LAST_UPDATED}. Diese Bedingungen regeln die Nutzung von Hilfinio als Vermittlungs- und Kommunikationsplattform.`}
          />
        </section>

        <section className="card-surface mt-6 rounded-[14px] p-7 text-sm leading-7 text-slate-800 dark:text-slate-200">
          {!resolvedVsbgStatus ? (
            <div className="mb-6 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Pflichtangabe vor Livegang ergaenzen</p>
              <p>{LEGAL_NOTES.missingVsbgStatus}</p>
            </div>
          ) : null}

          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                1. Geltungsbereich
              </h2>
              <p className="mt-2">
                Diese AGB gelten fuer die Nutzung der Plattform Hilfinio durch registrierte
                und nicht registrierte Nutzer, insbesondere Kunden, Anbieter und sonstige
                Interessenten.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                2. Rolle von Hilfinio
              </h2>
              <p className="mt-2">
                Hilfinio stellt eine technische Plattform bereit, ueber die Kunden und
                Anbieter miteinander in Kontakt treten, Anfragen austauschen und Leistungen
                anbahnen koennen.
              </p>
              <p className="mt-2">
                Hilfinio wird selbst nicht Vertragspartner der zwischen Kunden und Anbietern
                geschlossenen Dienstleistungsvertraege, schuldet nicht deren Erfuellung und
                uebernimmt keine Inkasso-, Gewaehrleistungs- oder Erfolgsgarantie fuer die
                vermittelte Leistung, sofern im Einzelfall nichts Abweichendes ausdruecklich
                vereinbart wurde.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                3. Registrierung und Nutzerkonto
              </h2>
              <p className="mt-2">
                Fuer bestimmte Funktionen ist ein Nutzerkonto erforderlich. Nutzer muessen
                zutreffende, aktuelle und vollstaendige Angaben machen und ihre Zugangsdaten
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
                Anbieter duerfen nur rechtmaessige und tatsaechlich verfuegbare Leistungen
                einstellen. Sie sind fuer die Richtigkeit ihrer Angaben, das Vorliegen
                erforderlicher Qualifikationen, Gewerbe- oder Berufszulassungen sowie fuer die
                Einhaltung steuerlicher, berufsrechtlicher und verbraucherschutzrechtlicher
                Pflichten selbst verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                5. Anfragen, Kommunikation und Vertragsabschluss
              </h2>
              <p className="mt-2">
                Kunden koennen ueber Hilfinio Anfragen an Anbieter stellen. Ein Vertrag kommt
                ausschliesslich zwischen Kunde und Anbieter zustande, wenn beide sich ueber die
                konkreten Vertragsbedingungen einigen. Hilfinio ist an diesem Vertragsschluss
                nicht beteiligt.
              </p>
              <p className="mt-2">
                Nutzer sind verpflichtet, im Rahmen der Kommunikation keine rechtswidrigen,
                beleidigenden, diskriminierenden, irrefuehrenden oder missbraeuchlichen
                Inhalte zu uebermitteln.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                6. Verifizierungshinweis
              </h2>
              <p className="mt-2">
                Ein Verifizierungsstatus bedeutet ausschliesslich, dass Hilfinio bestimmte
                Nachweise oder Angaben zum Zeitpunkt der Pruefung gesichtet hat. Der Status ist
                keine Zusicherung der fachlichen Qualitaet, Bonitaet, Zuverlaessigkeit,
                Rechtmaessigkeit oder fortbestehenden Berechtigung eines Anbieters.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                7. Inhalte, Bewertungen und Moderation
              </h2>
              <p className="mt-2">
                Hilfinio kann Inhalte und Bewertungen nach billigem Ermessen pruefen,
                einschränken, ausblenden oder entfernen, wenn konkrete Hinweise auf
                Rechtsverstoesse, Irrefuehrung, Missbrauch, Sicherheitsrisiken oder
                Verstoesse gegen diese AGB vorliegen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                8. Sperrung, Einschraenkung und Kuendigung
              </h2>
              <p className="mt-2">
                Hilfinio kann Konten oder einzelne Inhalte voruebergehend oder dauerhaft
                einschraenken, wenn ein sachlicher Grund vorliegt, insbesondere bei
                Missbrauch, Umgehung von Sicherheitsmechanismen, falschen Angaben,
                Rechtsverletzungen, ausbleibender Mitwirkung im Verifizierungsprozess oder zur
                Abwehr konkreter Risiken fuer andere Nutzer oder die Plattform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                9. Verfuegbarkeit
              </h2>
              <p className="mt-2">
                Hilfinio bemueht sich um eine moeglichst hohe Verfuegbarkeit. Eine jederzeit
                stoerungsfreie und unterbrechungslose Verfuegbarkeit wird jedoch nicht
                geschuldet. Wartungen, Sicherheitsupdates, technische Stoerungen oder
                Umstellungen koennen die Nutzbarkeit zeitweise einschraenken.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                10. Haftung
              </h2>
              <p className="mt-2">
                Hilfinio haftet unbeschraenkt bei Vorsatz, grober Fahrlaessigkeit, bei
                Verletzung von Leben, Koerper oder Gesundheit sowie nach zwingenden
                gesetzlichen Vorschriften.
              </p>
              <p className="mt-2">
                Bei leicht fahrlaessiger Verletzung wesentlicher Vertragspflichten ist die
                Haftung auf den vertragstypisch vorhersehbaren Schaden begrenzt. Im Uebrigen
                ist die Haftung fuer leicht fahrlaessige Pflichtverletzungen ausgeschlossen.
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
                Verbraucher seinen gewoehnlichen Aufenthalt hat.
              </p>
              <p className="mt-2">{LEGAL_NOTES.germanVersionAuthoritative}</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
