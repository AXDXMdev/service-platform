import PageContentHeader from "@/components/PageContentHeader"
import {
  LEGAL_HOSTING_PROVIDER,
  LEGAL_LAST_UPDATED,
  LEGAL_NOTES,
  LEGAL_OPERATOR,
  hasHostingProvider,
  hasOperatorAddress,
} from "@/lib/legal"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata = buildDefaultMetadata({
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung von Hilfinio mit Informationen zu Konten, Anfragen, Cookies, Consent, Hosting und Nutzerrechten.",
  path: "/datenschutz",
})

function retentionList() {
  return [
    "Kontodaten und Profildaten: bis zur Löschung des Kontos, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
    "Anfragen, Chat-Nachrichten und Statushistorien: grundsätzlich bis zu 3 Jahre nach Abschluss der letzten Anfrage, sofern keine längere Aufbewahrung zur Rechtsverteidigung oder aus gesetzlichen Gründen erforderlich ist.",
    "Wartelisten-Einträge: bis zum Start in der jeweiligen Region, bis zum Widerruf oder spätestens 24 Monate nach dem letzten nachweisbaren Kontakt.",
    "Verifizierungsanfragen und Nachweise: bis zum Abschluss des Verifizierungsverfahrens und danach grundsätzlich bis zu 3 Jahre zur Missbrauchsabwehr und Nachweisführung.",
    "Server- und Sicherheitslogs: in der Regel 7 bis 30 Tage, länger nur bei Sicherheitsvorfällen oder gesetzlichen Pflichten.",
  ]
}

export default function DatenschutzPage() {
  const hasPostalAddress = hasOperatorAddress()
  const resolvedHostingProvider = hasHostingProvider()

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <PageContentHeader
            slug="datenschutz"
            fallbackTitle="Datenschutzerklärung"
            fallbackSubtitle={`Stand: ${LEGAL_LAST_UPDATED}. Diese Datenschutzerklärung beschreibt die Verarbeitung personenbezogener Daten bei Hilfinio.`}
          />
        </section>

        <section className="card-surface mt-6 rounded-[14px] p-7 text-sm leading-7 text-slate-800 dark:text-slate-200">
          {!hasPostalAddress ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">TODO_LEGAL_REVIEW</p>
              <p>{LEGAL_NOTES.missingPostalAddress}</p>
            </div>
          ) : null}
          {!resolvedHostingProvider ? (
            <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">TODO_LEGAL_REVIEW</p>
              <p>{LEGAL_NOTES.missingHostingProvider}</p>
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            <section>
              <div className="mb-6 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-semibold">TODO_LEGAL_REVIEW</p>
                <p>{LEGAL_NOTES.legalReview}</p>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                1. Verantwortlicher
              </h2>
              <p className="mt-2">
                Verantwortlich für die Datenverarbeitung auf dieser Website und in der
                Hilfinio-Plattform ist {LEGAL_OPERATOR.name}.
              </p>
              <p>E-Mail: {LEGAL_OPERATOR.email}</p>
              {hasPostalAddress ? (
                LEGAL_OPERATOR.addressMultiline.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p className="text-amber-700 dark:text-amber-300">
                  Die ladungsfähige Anschrift wird aus den zentralen Legal-Konstanten
                  geladen.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                2. Zwecke, Kategorien und Rechtsgrundlagen
              </h2>
              <div className="mt-2 space-y-3">
                <p>
                  <span className="font-semibold">Bereitstellung der Website:</span> Wir
                  verarbeiten technische Zugriffsdaten, um die Website auszuliefern, die
                  Stabilität zu sichern und Angriffe abzuwehren. Rechtsgrundlage ist Art. 6
                  Abs. 1 lit. f DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Konten und Authentifizierung:</span> Bei
                  Registrierung, Anmeldung und Passwort-Reset verarbeiten wir insbesondere
                  E-Mail-Adresse, Kontometadaten und Sicherheitsinformationen. Rechtsgrundlage
                  ist Art. 6 Abs. 1 lit. b DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Anbieterprofile und Dienstleistungen:</span>{" "}
                  Angaben zu Anbietername, Beschreibung, Stadt, Verfügbarkeit, optionalen
                  Medien und vertrauensrelevanten Profilfeldern werden verarbeitet, um
                  Anbieterprofile zu veröffentlichen und Anfragen zu vermitteln.
                  Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Anfragen, Buchungen und Chat:</span>{" "}
                  Inhaltsdaten, Statusänderungen und Kommunikationsinhalte werden
                  verarbeitet, um Anfragen zwischen Kunden und Anbietern zu übermitteln,
                  Missbrauch zu verhindern und Supportfälle nachvollziehen zu können.
                  Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b und lit. f DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Warteliste:</span> Bei Eintrag in die
                  Warteliste verarbeiten wir Name, E-Mail, Stadt, Rolle und freiwillige
                  Nachricht, um den Markteintritt in deiner Region vorzubereiten und dich
                  hierzu zu informieren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO;
                  für optionale Marketing-Nachrichten Art. 6 Abs. 1 lit. a DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Anbieter-Verifizierung:</span> Bei
                  Verifizierungsanfragen verarbeiten wir Kontaktangaben, Nachweislinks und
                  Verfahrensmetadaten, um Angaben zu prüfen, Missbrauch zu verhindern und
                  den Verifizierungsstatus zu dokumentieren. Rechtsgrundlagen sind Art. 6
                  Abs. 1 lit. b und lit. f DSGVO.
                </p>
                <p>
                  <span className="font-semibold">Kontakt und Support:</span> Nachrichten
                  über Formulare oder Supportkanäle werden zur Bearbeitung deiner Anfrage
                  verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b oder lit. f DSGVO.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                3. Empfänger und Dienstleister
              </h2>
              <div className="mt-2 space-y-3">
                <p>
                  <span className="font-semibold">Hosting:</span> Hilfinio wird über{" "}
                  {LEGAL_HOSTING_PROVIDER} technisch bereitgestellt. Der Dienst dient dem
                  Hosting, der Auslieferung, dem Deployment und sicherheitsrelevanten
                  Plattformfunktionen.
                </p>
                <p>
                  Für Datenbank, Authentifizierung, Storage und API-Funktionen nutzt
                  Hilfinio Supabase als technischen Dienstleister. TODO_LEGAL_REVIEW: Der
                  Auftragsverarbeitungsvertrag, eingesetzte Regionen und Unterauftragsverarbeiter
                  müssen im Verzeichnis der Verarbeitungstätigkeiten final dokumentiert werden.
                </p>
                <p>
                  Für Hosting, CDN, Build- und Performance-Funktionen wird Vercel als
                  Infrastruktur-Anbieter eingesetzt. TODO_LEGAL_REVIEW: Rechtsgrundlage,
                  Sitz, DPA und Drittlandtransfer müssen vor öffentlicher Skalierung final
                  juristisch bestätigt werden.
                </p>
                <p>
                  Daten werden im Übrigen nur offengelegt, wenn dies für die
                  Vertragserfüllung erforderlich ist, eine Einwilligung vorliegt, eine
                  gesetzliche Pflicht besteht oder dies zur Rechtsdurchsetzung erforderlich
                  ist.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                4. Internationale Datentransfers
              </h2>
              <p className="mt-2">
                Sofern Dienstleister oder Unterauftragsverarbeiter Daten außerhalb der EU/des
                EWR verarbeiten oder von dort aus darauf zugreifen können, erfolgt dies nur
                auf Grundlage eines Angemessenheitsbeschlusses oder geeigneter Garantien, etwa
                Standardvertragsklauseln. TODO_LEGAL_REVIEW: Der tatsächliche Transferpfad für
                Hosting, Support, Supabase und optionale Analyse-Tools muss final dokumentiert werden.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                5. Cookies, Local Storage und Einwilligungen
              </h2>
              <div className="mt-2 space-y-3">
                <p>
                  Hilfinio verwendet technisch notwendige Speicherungen, insbesondere für
                  Spracheinstellungen, Barrierefreiheitsoptionen, Theme-Modus und
                  Sitzungsfunktionen. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. f DSGVO sowie
                  bei vertraglich erforderlichen Funktionen Art. 6 Abs. 1 lit. b DSGVO.
                </p>
                <p>
                  Marketing- oder Werbeskripte, insbesondere Google AdSense, werden nur nach
                  ausdrücklicher Einwilligung geladen. Rechtsgrundlage ist Art. 6 Abs. 1 lit.
                  a DSGVO. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die
                  Zukunft widerrufen werden.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                6. Standortdaten
              </h2>
              <p className="mt-2">
                Wenn du auf Hilfinio freiwillig einen groben Standort freigibst, wird dieser
                nur für die jeweilige Funktion, etwa zur regionalen Einordnung eines
                Angebots, verarbeitet. Die Standortnutzung ist optional. Rechtsgrundlage ist
                Art. 6 Abs. 1 lit. a DSGVO beziehungsweise Art. 6 Abs. 1 lit. b DSGVO, wenn
                die Angabe für deine Anfrage oder dein Angebot erforderlich ist.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                7. Speicherdauer
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {retentionList().map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                8. Deine Rechte
              </h2>
              <p className="mt-2">
                Du hast nach Maßgabe der gesetzlichen Voraussetzungen Rechte auf Auskunft,
                Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch,
                Datenübertragbarkeit sowie auf Widerruf erteilter Einwilligungen mit Wirkung
                für die Zukunft.
              </p>
              <p className="mt-2">
                Zur Ausübung deiner Rechte genügt eine Nachricht an {LEGAL_OPERATOR.email}.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                9. Beschwerderecht
              </h2>
              <p className="mt-2">
                Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu
                beschweren, insbesondere in dem Mitgliedstaat deines gewöhnlichen
                Aufenthalts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                10. Pflicht zur Bereitstellung von Daten
              </h2>
              <p className="mt-2">
                Bestimmte Daten sind für Registrierung, Anfrage, Verifizierung oder
                Wartelistenverwaltung erforderlich. Ohne diese Daten können einzelne
                Plattformfunktionen nicht genutzt werden.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                11. Änderungen dieser Datenschutzerklärung
              </h2>
              <p className="mt-2">
                Wir passen diese Datenschutzerklärung an, wenn sich Funktionen, eingesetzte
                Dienstleister oder die Rechtslage wesentlich ändern.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
