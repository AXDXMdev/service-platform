# Hilfinio Legal Launch Readiness Audit

Stand: 2026-05-06

Hinweis: Dieses Dokument ersetzt keine anwaltliche Beratung. Es ist ein produkt- und engineering-nahes Launch-Audit fuer Deutschland und die EU.

## Kurzfazit

Hilfinio ist technisch nah an einem launch-faehigen MVP, hat aber weiterhin rechtliche Blocker. Der groesste Blocker ist das unvollstaendige Impressum: Es fehlt noch die vollstaendige ladungsfaehige Anschrift des Betreibers. Ebenfalls kritisch waren die bisher fehlende Einwilligungslogik fuer Werbeskripte sowie fehlende Consent-Nachweise in Warteliste und Anbieter-Verifizierung. Diese beiden Produktstellen wurden jetzt technisch gehaertet.

## Bereits umgesetzt

- Impressum, Datenschutzerklaerung und AGB inhaltlich auf einen produktionsnahen Stand gebracht.
- Google-AdSense-Einbindung hinter ein Consent-Banner verschoben.
- Wartelisten-Formular mit Pflicht-Hinweis Datenschutz und optionalem Marketing-Opt-in erweitert.
- Anbieter-Verifizierungsformular mit Datenschutz- und Verifizierungs-Disclaimer erweitert.
- Automatisches, stilles Schreiben in die Warteliste aus dem Service-Flow entfernt.
- Datenbank-Migration fuer Consent-Nachweise vorbereitet.
- Zentrale Legal-Konfiguration mit Platzhaltern fuer Betreiber- und Hosting-Daten eingefuehrt.
- Cookie-Einstellungsseite mit widerrufbarer Consent-Verwaltung ergaenzt.
- DSGVO-Datenexport als geschuetzte API und UI eingebaut.
- Account-Loeschungsflow mit Antrag oder Direktloeschung vorbereitet.
- Abuse-/DSA-Meldeformular, interner Admin-Endpunkt und neue Datenbanktabellen vorbereitet.

## Risiko-Matrix

### BLOCKER

| Datei / Bereich | Problem | Risiko | Konkrete Loesung | Beispielcode / Text | Pflicht oder Empfehlung |
| --- | --- | --- | --- | --- | --- |
| `/app/impressum/page.tsx` | Vollstaendige ladungsfaehige Anschrift fehlt | Abmahn- und Wettbewerbsrisiko; Impressum nicht vollstaendig | Strasse, Hausnummer und Postleitzahl des Betreibers eintragen | `LEGAL_OPERATOR.postalAddressLines = ["Strasse Hausnummer", "PLZ Stuttgart"]` | Pflicht |
| Hosting / Datenschutz | Konkreter Hosting-Anbieter ist in der Datenschutzerklaerung noch nicht final benannt | Unvollstaendige Information nach Art. 13 DSGVO | Finalen Hosting-Anbieter samt DPA, Sitz und Zweck eintragen | Abschnitt 3 in `/app/datenschutz/page.tsx` finalisieren | Pflicht |
| Nutzerrechte / Backend | Kein echter Self-Service fuer Account-Loeschung oder Datenexport | Ausuebung von Betroffenenrechten nur manuell moeglich, Support-Risiko | Support-Prozess jetzt dokumentieren, danach API fuer Export und Loeschung bauen | Siehe TODOs unten | Pflicht vor Skalierung, spaetestens vor breiterem Launch |

### HIGH

| Datei / Bereich | Problem | Risiko | Konkrete Loesung | Beispielcode / Text | Pflicht oder Empfehlung |
| --- | --- | --- | --- | --- | --- |
| `/app/layout.tsx`, `/components/ConsentBanner.tsx`, `/components/MarketingScripts.tsx` | Marketing-Skript durfte vorher ohne Consent laden | Verstoss gegen Einwilligungsanforderungen fuer nicht notwendige Tracking-/Werbetechnologien | Bereits umgesetzt; Consent-Entscheidung spaeter um Einstellungsseite ergaenzen | Marketing erst nach `hilfinio-consent-v1` laden | Pflicht |
| `/app/waitlist/page.tsx` | Vorher fehlte klare Trennung zwischen Launch-Info und Marketing-Einwilligung | Unwirksame oder gekoppelte Einwilligung | Bereits umgesetzt; fuer echte Marketing-Mails Double-Opt-in ergaenzen | getrennte Checkbox fuer Marketing | Pflicht fuer Marketing-Nutzung |
| `/app/provider-verification/page.tsx` | Vorher kein expliziter Hinweis, was "verifiziert" bedeutet | Irrefuehrungs- und Haftungsrisiko | Bereits umgesetzt; Verifizierungslogik und Texte konsistent halten | "keine Garantie fuer Qualitaet..." | Pflicht |
| Content Moderation / DSA | Kein expliziter Meldeweg fuer rechtswidrige Inhalte oder unberechtigte Einschraenkungen | DSA- und Support-Risiko bei Plattformbetrieb | Interne Complaint-/Abuse-Strecke einbauen | Formular /support oder /report mit Ticketing | Pflicht fuer Plattformbetrieb |
| `/app/agb/page.tsx` | Plattformrolle war vorher zu allgemein | Unklare Verantwortungsabgrenzung zwischen Plattform und Anbieter | Bereits praezisiert; Terms spaeter anwaltlich gegentesten | Hilfinio ist nicht Vertragspartner der Dienstleistung | Pflicht |

### MEDIUM

| Datei / Bereich | Problem | Risiko | Konkrete Loesung | Beispielcode / Text | Pflicht oder Empfehlung |
| --- | --- | --- | --- | --- | --- |
| `/app/create-service/page.tsx` | Vorher stilles Wartelisten-Opt-in aus einem anderen Flow | Zweckaenderungs- und Transparenzproblem | Bereits entfernt; Nutzer jetzt bewusst zur Warteliste fuehren | kein automatischer Waitlist-Insert mehr | Pflicht |
| `/supabase/migrations/20260506_legal_consent_hardening.sql` | Consent-Nachweise waren nicht speicherbar | Nachweisproblem bei Opt-ins | Migration ausfuehren und Admin-Sicht fuer Consent-Felder erweitern | `privacy_accepted_at`, `marketing_opt_in` | Pflicht |
| Impressum / VSBG | Entscheidung zur Teilnahme an Verbraucherschlichtung ist derzeit als "nicht bereit/nicht verpflichtet" hinterlegt | Falsch, falls spaeter doch eine Teilnahme zugesagt oder Pflicht entsteht | Vor Launch mit dem realen Geschaeftsmodell verifizieren | Text in Impressum und AGB angleichen | Pflicht |
| Datenschutz / Standortdaten | Standortnutzung ist beschrieben, aber keine dedizierte Feinsteuerung im UI | Transparenz- und UX-Risiko | Vor mobilem Rollout Berechtigungsdialoge und Zweckhinweise angleichen | UI-Hinweis vor Standortzugriff | Empfehlung mit Compliance-Relevanz |

### LOW

| Datei / Bereich | Problem | Risiko | Konkrete Loesung | Beispielcode / Text | Pflicht oder Empfehlung |
| --- | --- | --- | --- | --- | --- |
| Rechtstexte mehrsprachig | Rechtstexte liegen derzeit nur auf Deutsch belastbar vor | Gering, solange deutsche Fassung massgeblich bleibt | Englische/Tuerkische Infoversion spaeter ergaenzen | `Massgeblich ist die deutsche Fassung.` | Empfehlung |
| Consent-Verwaltung | Noch keine Einstellungsseite zum spaeteren Aendern der Entscheidung | UX-/Support-Aufwand | Footer-Link "Cookie-Einstellungen" spaeter ergaenzen | Reopen-Button fuer Banner | Empfehlung |

## Engineering TODOs

### Frontend

1. Vollstaendige Betreiberanschrift in `lib/legal.ts` hinterlegen.
2. Footer- oder Datenschutz-Link fuer spaetere Aenderung der Consent-Entscheidung ergaenzen.
3. Abuse- und Illegal-Content-Meldung als eigene Seite oder Support-Flow bauen.
4. Hinweis bei Kontoloeschung im Profilbereich vorbereiten.

### Backend

1. API oder Server Action fuer Datenexport pro Nutzer aufbauen.
2. API oder Admin-Workflow fuer Kontoloeschung samt Fristen und Soft-Delete-Strategie aufbauen.
3. Moderations- und Restriktionsentscheidungen nachvollziehbar protokollieren.

### Datenbank

1. Migration `20260506_legal_consent_hardening.sql` ausfuehren.
2. Optional Audit-Log-Tabelle fuer Moderations-, Sperr- und Consent-Aenderungen ergaenzen.
3. Retention-Job fuer Warteliste und alte Verifizierungsnachweise planen.

### Consent-Management

1. Dokumentieren, welche Skripte technisch notwendig und welche zustimmungspflichtig sind.
2. Falls Analytics hinzukommt: ebenfalls hinter Consent schalten.
3. Widerruf der Marketing-Einwilligung im Nutzerkonto oder ueber Support operationalisieren.

### Logging und Support

1. Datenschutzfreundliche Server-Logs beibehalten; keine Tokens, Secrets oder Klartext-Passwoerter loggen.
2. Support-Runbook fuer Auskunft, Berichtigung, Export und Loeschung erstellen.
3. Abuse-Handling mit Prioritaeten und Eskalation definieren.

### Accountloeschung und Datenexport

1. Frist definieren: z. B. Loeschung des Nutzerkontos binnen 30 Tagen, soweit keine Aufbewahrungspflichten entgegenstehen.
2. Exportformat definieren: JSON oder ZIP mit Profil, Services, Requests, Chat-Nachrichten.
3. Ausnahmen dokumentieren: Daten, die aus rechtlichen Gruenden voruebergehend aufbewahrt werden muessen.

## Offene Fakten, die vor Livegang entschieden oder geliefert werden muessen

1. Vollstaendige Betreiberanschrift.
2. Falls vorhanden: Telefonnummer fuer schnellen direkten Kontakt.
3. Falls vorhanden: USt-IdNr.
4. Finaler Hosting-Anbieter im Produktivbetrieb.
5. Ob Marketing/Adsense beim Launch ueberhaupt aktiv sein soll.
6. Ob Hilfinio an Verbraucherschlichtung teilnimmt oder nicht.

## Geaenderte Dateien in dieser Runde

- `/Users/alaadinadem/service-platform/app/impressum/page.tsx`
- `/Users/alaadinadem/service-platform/app/datenschutz/page.tsx`
- `/Users/alaadinadem/service-platform/app/agb/page.tsx`
- `/Users/alaadinadem/service-platform/app/provider-verification/page.tsx`
- `/Users/alaadinadem/service-platform/app/waitlist/page.tsx`
- `/Users/alaadinadem/service-platform/app/create-service/page.tsx`
- `/Users/alaadinadem/service-platform/app/layout.tsx`
- `/Users/alaadinadem/service-platform/components/ConsentBanner.tsx`
- `/Users/alaadinadem/service-platform/components/MarketingScripts.tsx`
- `/Users/alaadinadem/service-platform/lib/legal.ts`
- `/Users/alaadinadem/service-platform/supabase/migrations/20260506_legal_consent_hardening.sql`

## Empfohlene Reihenfolge vor dem Launch

1. Betreiberanschrift finalisieren und Impressum fertig machen.
2. Migration fuer Consent-Nachweise ausrollen.
3. Hosting-Angaben und DPA-Lage final in die Datenschutzerklaerung eintragen.
4. Abuse-/Complaint-Handling fuer Plattformbetrieb bauen.
5. Account-Loeschung und Datenexport definieren und umsetzen.
