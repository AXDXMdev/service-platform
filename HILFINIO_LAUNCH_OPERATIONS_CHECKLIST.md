# HILFINIO LAUNCH OPERATIONS CHECKLIST

Stand: 2026-05-09

Diese Checkliste ist das operative Gegenstueck zu den Technik- und Legal-Audits. Sie ersetzt keine Rechtsberatung, hilft uns aber dabei, den Launch reproduzierbar und supportbar zu machen.

## 1. Rechtliche Pflichtangaben vor Launch

- [ ] Vollstaendige ladungsfaehige Anschrift in [lib/legal.ts](/Users/alaadinadem/service-platform/lib/legal.ts:1) eintragen
- [ ] Finalen Hosting-Anbieter in [lib/legal.ts](/Users/alaadinadem/service-platform/lib/legal.ts:1) eintragen
- [ ] VSBG-Status in [lib/legal.ts](/Users/alaadinadem/service-platform/lib/legal.ts:1) eintragen
- [ ] Falls vorhanden: Telefonnummer ergänzen
- [ ] Falls vorhanden: USt-IdNr. ergänzen
- [ ] Impressum, Datenschutz und AGB nach finalem Eintrag erneut gegenlesen
- [ ] Juristische Schlussprüfung vor öffentlichem Deutschland-/EU-Launch einplanen

## 2. Infrastruktur und Secrets

- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig gesetzt
- [ ] `ADMIN_PANEL_PASSWORD` gesetzt und nicht wiederverwendet
- [ ] `ADMIN_PANEL_TOKEN` gesetzt und ausreichend lang/zufällig
- [ ] `NEXT_PUBLIC_SITE_URL` auf die finale Produktivdomain gesetzt
- [ ] Ads-Variablen nur setzen, wenn Consent und Werbebetrieb wirklich gewollt sind
- [ ] `.env.local` / Hosting-Secrets nicht geloggt und nicht committed

## 3. Datenbank und Migrationen

- [ ] Alle Supabase-Migrationen im Zielprojekt ausgeführt
- [ ] RLS-Policies im Produktivprojekt verifiziert
- [ ] `20260506_legal_consent_hardening.sql` ausgeführt
- [ ] `20260506_user_rights_and_abuse_flows.sql` ausgeführt
- [ ] `20260509_abuse_reports_bug_category.sql` ausgeführt
- [ ] Storage-Buckets `service-media` und `site-assets` vorhanden
- [ ] Storage-Policies für Uploads gegen Fremdzugriffe geprüft

## 4. Monitoring und Sichtbarkeit

- [ ] Produktiv-Build auf Staging geprüft
- [ ] `/api/health` liefert auf Staging `200` bzw. erklaerbares `degraded`
- [ ] Fehlerlogs für API-Routen abrufbar
- [ ] Strukturierte Server-Logs mit `requestId`, Route und Dauer im Hosting sichtbar
- [ ] Next.js `instrumentation.ts` Fehler-Hook im Zielhosting verifiziert
- [ ] Deployment-Logs und Build-Logs dokumentiert
- [ ] Verantwortliche Person für den Launch-Tag benannt
- [ ] Support-E-Mail und Reaktionsweg für Bugs/Meldungen definiert
- [ ] Admin-Zugang im Notfall getestet

## 5. Support und Incident-Ablauf

- [ ] Wer prüft `/report`-Meldungen?
- [ ] Wer bearbeitet Account-Löschungen?
- [ ] Wer beantwortet Datenschutz-Anfragen?
- [ ] Wie werden Abuse- und Bug-Meldungen priorisiert?
- [ ] Wie wird ein produktiver Fehler intern dokumentiert?
- [ ] Wie wird ein Rollback entschieden und ausgelöst?

Empfohlene Priorisierung fuer eingehende Meldungen:

1. Sicherheitsproblem / Datenschutzproblem
2. Login / Anfrage / Chat komplett kaputt
3. Anbieter-/Kunden-Workflow eingeschraenkt
4. Bug mit Workaround
5. Inhaltliche oder kosmetische Fehler

## 6. Release-Day Runbook

Vor dem Release:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] kritische Seiten kurz manuell prüfen:
  - [ ] `/`
  - [ ] `/services`
  - [ ] `/service/[id]`
  - [ ] `/login`
  - [ ] `/register`
  - [ ] `/create-service`
  - [ ] `/dashboard`
  - [ ] `/my-requests`
  - [ ] `/chat/[requestId]`
  - [ ] `/favorites`
  - [ ] `/waitlist`
  - [ ] `/report`
  - [ ] `/impressum`
  - [ ] `/datenschutz`
  - [ ] `/agb`

Direkt nach dem Release:

- [ ] Startseite live erreichbar
- [ ] `/api/health` ist `ready`
- [ ] Login funktioniert
- [ ] Anfrage-Erstellung funktioniert
- [ ] Chat-Nachricht kann gespeichert werden
- [ ] Favoriten speichern funktioniert
- [ ] Bug-/Abuse-Meldung kommt im Admin-/Compliance-Backend an
- [ ] Keine offensichtlichen 500er in Logs

## 7. Recovery / Rollback

- [ ] Letzte stabile Deployment-Version bekannt
- [ ] Rollback-Verantwortlicher benannt
- [ ] Entscheidungskriterien für Rollback dokumentiert
- [ ] Datenbank-Migrationen mit Risiko vorab markiert
- [ ] Keine destruktive Migration ohne Backup-Plan

Rollback-Auslöser sollten mindestens sein:

- Login oder Registrierung für Nutzer ausfällt
- Anfragen / Chat / Favoriten speichern nicht mehr funktionieren
- Rechtstexte oder Consent-Flow fehlen live
- kritischer Security- oder Datenschutzfehler entdeckt wird

## 8. Noch offene Punkte nach aktuellem Stand

- Vollständige Legal-Placeholders eintragen
- Admin-Monolith weiter zerlegen
- Echte Datenbank-/RLS-Integrationstests gegen Testumgebung aufbauen
- Uploads langfristig in stärkere serverseitige Pipeline überführen
- Monitoring und Alerting je nach Hosting-Plattform konkretisieren
- Alarmweg definieren: Wer sieht `degraded`/Fehler zuerst und innerhalb welcher Zeit?

## 9. Empfohlene Reihenfolge

1. Legal-Placeholders final setzen
2. Operations-Rollen und Supportweg festlegen
3. Staging-Deploy prüfen
4. Launch-Checks aus Abschnitt 6 durchgehen
5. Erst dann Produktiv-Schaltung

## 10. Letzter lokaler Trockenlauf

Stand: 2026-05-14

- `npm test` ✅
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
- `GET /api/health` lokal auf `ready` ✅
- Oeffentliche Read-APIs fuer Startseite und Services-Katalog antworten wieder `200` ✅
- Anbieter-Read-Route gibt fuer ungueltige IDs jetzt sauber `400` statt `500` ✅
- Visuelle Browser-Abnahme fuer Kernseiten (`/`, `/services`, `/login`, `/register`, `/waitlist`, `/report`, `/impressum`, `/datenschutz`, `/agb`, `/create-service`) antwortet mit `200` und rendert Hauptinhalt ✅
- CSP fuer Vercel Speed Insights angepasst; vorher geblocktes Skript `va.vercel-scripts.com` laeuft im lokalen Browser-Check jetzt ohne Console-Fehler ✅
- Erwartete unauthentifizierte Antworten fuer geschuetzte APIs (`/api/dashboard/*`, `/api/favorites/list`) liefern `401` ✅
- Wichtiger Hinweis vor echtem Launch:
  - `NEXT_PUBLIC_SITE_URL` ist lokal noch nicht gesetzt und muss fuer Produktion eingetragen werden
  - Rechtliche Pflichtwerte bleiben offene Blocker, solange `{{OPERATOR_ADDRESS}}`, `{{HOSTING_PROVIDER}}` und `{{VSBG_STATUS}}` nicht mit echten Angaben ersetzt sind
  - manuelle visuelle Abnahme der Kernseiten und Kernflows auf Staging bleibt Pflicht
