# HILFINIO TECH REPORT

Stand: 2026-05-06

## Gesamtstatus
🟡

Hilfinio ist technisch deutlich weiter als ein fruehes Prototype-Stadium: Build, Lint, TypeScript und Basistests laufen sauber, die Supabase-Migrationsbasis ist umfangreich, und zentrale Nutzer- und Admin-Flows existieren. Gleichzeitig ist die Codebasis noch nicht durchgaengig production-ready, weil mehrere kritische Geschaeftsprozesse direkt in Client-Komponenten gegen Supabase geschrieben werden, der Adminbereich stark monolithisch ist und einige Sicherheits-/Betriebsmechanismen noch nur teilweise vorhanden sind.

## Frontend
🟡

- Next.js App Router sauber im Einsatz.
- Designsystem, Theme, Accessibility und i18n-Grundlage vorhanden.
- Viele Kernseiten sind funktional: Services, Service-Detail, Dashboard, Warteliste, Auth, Admin.
- Mehrere produktkritische Flows liegen noch direkt im Client mit eigenen Datenzugriffen und Statuslogik.
- Einige große Seitenkomponenten tragen zu hoher Wartungslast bei, vor allem `app/admin/AdminCmsClient.tsx`.

## Backend
🟡

- Serverseitige API-Struktur ist vorhanden, aber noch schmal.
- Positiv: gemeinsame Server-Utilities fuer API-Antworten, Logging, Supabase-Clients, Auth-Checks.
- Negativ: wesentliche Business-Logik fuer Requests, Chat, Services und Teile des Supports lebt weiterhin im Frontend statt in klaren Server-Flows.
- Neue produktionsnahe Flows fuer Datenexport, Kontoloeschung und Abuse-Reporting sind jetzt vorhanden.
- Zentrales Middleware-/Controller-/Service-Muster ist noch nicht durchgaengig umgesetzt.

## Datenbank
🟡

- Supabase-Migrationsstruktur ist gut nachvollziehbar.
- RLS ist fuer viele Kernbereiche bereits angelegt: `profiles`, `services`, `requests`, `request_events`, `reviews`, `favorites`, `chat_messages`, `waitlist_entries`, `provider_verification_requests`, `support_audit_events`.
- Neue Compliance-Tabellen und Consent-Felder sind vorbereitet.
- Es fehlen noch betriebliche Folgeschritte wie Retention-Jobs, konsistente Audit-Trails ueber alle sensiblen Flows und ein formalisiertes Datenloeschkonzept.

## APIs
🟡

- Vorhanden: `site-settings`, `admin/support`, `admin/compliance`, `account/export`, `account/delete`, `report`.
- Gemeinsames Antwortformat ueber `lib/apiResponse.ts`.
- Neue serverseitige Auth-Helfer und Rate-Limiting-Bausteine ergaenzt.
- Noch offen: breitere API-Kapselung fuer bestehende Client-Supabase-Writes.

## Authentifizierung
🟡

- Nutzer-Auth ueber Supabase ist solide und produktionsnah.
- Rollenabfrage ueber `profiles.role` ist vorhanden.
- Adminbereich nutzt zusaetzlich ein eigenes Cookie-basiertes Gate mit `ADMIN_PANEL_PASSWORD` und `ADMIN_PANEL_TOKEN`.
- Das ist pragmatisch, aber kein starkes Langfristmodell fuer anspruchsvollere Admin-Sicherheit oder Teambetrieb.

## Rollen / Rechte
🟡

- Rollenlogik mit `customer`, `provider`, `admin`, teils `moderator` ist vorhanden.
- RLS-Basis ist fuer viele Tabellen sinnvoll gesetzt.
- Admin-/Moderator-Helferfunktion `public.is_admin_or_moderator()` wird bereits genutzt.
- Nicht alle Prozesse laufen serverzentriert; dadurch bleibt Rechtepruefung teils im Zusammenspiel aus Clientlogik und RLS statt in sauber gekapselten Endpunkten.

## Buchungssystem / Anfragefluss
🟡

- Requests, Statuswechsel, Event-Historie, Provider-Angebote und Kundenarchiv sind vorhanden.
- Workflow-Logik existiert in `lib/requestWorkflow.ts`.
- Problem: Statusaenderungen laufen direkt aus Client-Komponenten in die Datenbank.
- Das ist funktional, aber fuer Nachvollziehbarkeit, Debugging und spaetere Erweiterbarkeit zu eng an die UI gekoppelt.

## Zahlungslogik
🔴

- Es gibt Preisfelder und Angebots-/Endpreis-Spalten.
- Es gibt jedoch keine echte Zahlungsintegration, keine Checkout-Strecke, keine Webhooks, keine Rechnungslogik und keine Zahlungszustandsmaschine.
- Falls echte bezahlte Buchungen geplant sind, ist dieser Bereich aktuell nicht launch-ready.

## Upload-System
🟡

- Storage-Bucket `service-media` ist vorgesehen.
- Clientseitige Dateifilter fuer Typ und Dateigroesse sind vorhanden.
- Supabase Storage Policies sind angelegt.
- Es fehlt serverseitige Inhaltspruefung, Missbrauchsdetektion und tieferes Handling fuer problematische Uploads.

## Adminbereich
🟡

- Admin-Login, Session-API, Support-API und CMS-Client sind vorhanden.
- Neue Compliance-API fuer Abuse-Reports und Account-Loeschantraege ist ergaenzt.
- Groesster Schwachpunkt: `app/admin/AdminCmsClient.tsx` ist ein grosser Monolith und schwer weiterzuentwickeln, zu testen und zu reviewen.

## Deployment
🟡

- `.env.example`, Build-Scripts und Produktionschecks sind vorhanden.
- Security-Header und CSP sind konfiguriert.
- Service-Role-Key bleibt serverseitig.
- Noch offen: finales Hosting-Setup, Monitoring, Alerting, Rollback-Strategie und vollstaendige Betriebsdoku.

## Performance
🟡

- Positiv: Image-Remote-Patterns, Caching-Helfer fuer Clientdaten, statische und dynamische Route-Trennung.
- Negativ: mehrere Seiten laden Daten clientseitig in mehreren Schritten, was zu Fetch-Wasserfaellen und mehr Renderarbeit fuehrt.
- Business-Daten werden auf mehreren Seiten parallel oder wiederholt aus Supabase geholt, statt ueber klar gebuendelte Serverdatenfluesse.

## Sicherheit
🟡

- Positiv:
  - RLS vorhanden
  - Service-Role-Key nur serverseitig
  - Security-Header/CSP vorhanden
  - neue sensible API-Routen haben Auth-Checks
  - Ads erst nach Consent
  - Rate Limiting fuer Admin-Login, Abuse-Reporting und Kontoloeschung jetzt zentralisiert
  - Admin-Cookie-Pruefung jetzt mit `timingSafeEqual`
- Kritisch bzw. offen:
  - kein globales Rate Limiting
  - keine zentrale Request-Validation-Schicht fuer alle Server-Endpunkte
  - viele direkte Client-Schreibzugriffe auf Supabase bleiben ein strukturelles Risiko
  - Adminzugang ist funktional, aber kein vollwertiges internes IAM-Modell

## Tests
🟡

- `npm run lint`: erfolgreich
- `npm run typecheck`: erfolgreich
- `npm run build`: erfolgreich
- `npm test`: erfolgreich
- Der Testumfang ist aktuell nur ein Smoke-/Utility-Niveau, keine echten Integrations- oder End-to-End-Checks.

## Environment Setup
🟡

- `.env.example` ist vorhanden und dokumentiert die wichtigsten Schluessel sauber.
- Trennung zwischen `NEXT_PUBLIC_*` und serverseitigen Secrets ist korrekt angelegt.
- Noch offen: finale Produktionswerte, Hosting-Facts, Monitoring-Secrets und ein standardisierter Ops-Runbook-Stand.

## Abhaengigkeiten
🟡

- Root-Dependencies sind schlank.
- `npm audit` meldet moderate Advisories rund um `next`/transitives `postcss`.
- Kein sinnvoller Safe-Fix ueber `npm audit fix` ohne riskanten Eingriff ersichtlich.

## Codequalitaet
🟡

- Durchgaengig TypeScript, relativ konsistente Utilities und solide Benennung.
- Deutlich sichtbare technische Schuld:
  - grosse Client-Monolithen
  - UI-nahe Business-Logik
  - wenig testbare Serviceschichten fuer Produktlogik
  - inkonsistente Tiefe zwischen robusten API-Bausteinen und direkt verdrahteten Supabase-Aufrufen

## Entfernte Altlasten

- Unnoetiges `useMemo` im Chat-UI entfernt.
- Sensible Rate-Limit-Logik aus Einzelroute in zentrales Utility verschoben.
- AdSlot respektiert jetzt Consent auch im Slot selbst, nicht nur beim globalen Script.

## Optimierungen

- `lib/serverRateLimit.ts` als gemeinsamer Baustein eingefuehrt.
- `lib/adminSession.ts` auf timing-safe Vergleich gehaertet.
- `app/admin/session/route.ts` auf zentrales Rate Limiting umgestellt.
- `app/api/account/delete/route.ts` mit Rate Limit abgesichert.
- `app/api/report/route.ts` mit Rate Limit abgesichert.
- `components/AdSlot.tsx` an Consent gekoppelt.
- Neue technische und rechtliche Infrastruktur aus den letzten Schritten bleibt build-stabil.

## Kritische Probleme

1. Zahlungslogik fehlt komplett als echte Produktionsstrecke.
2. Wichtige Geschaeftsprozesse schreiben weiterhin direkt aus dem Client nach Supabase.
3. Admin-CMS ist funktional, aber als Monolith langfristig wartungsriskant.
4. Tests decken keine echten End-to-End- oder API-Sicherheitsfaelle ab.
5. `npm audit` meldet moderate Abhaengigkeitsrisiken, die beobachtet werden muessen.

## Naechste Prioritaeten

1. Request-/Chat-/Service-Schreibfluesse schrittweise aus Client-Supabase in serverseitige Route-/Service-Schichten ueberfuehren.
2. Adminbereich entkoppeln: `AdminCmsClient` in Module fuer CMS, Support, Reviews, Compliance und Provider-Verifikation aufteilen.
3. Echte Integrations- und Sicherheitschecks ergaenzen: API-Tests, Auth-/RLS-Szenarien, Abuse-/Delete-/Export-Flows.

## Ehrliche Ampel je Kategorie

🟡 Frontend  
- reich an Funktionen, aber noch clientlastig und teils zu eng gekoppelt

🟡 Backend  
- solide Grundlage, aber noch nicht konsequent service- und serverzentriert

🟡 Datenbank  
- gute RLS- und Migrationsbasis, aber noch nicht voll ausoperationalisiert

🟡 APIs  
- brauchbar, aber noch zu wenig fuer die Menge an Business-Logik

🟡 Authentifizierung  
- Nutzer-Auth gut, Admin-Auth zweckmaessig aber begrenzt

🟡 Rollen/Rechte  
- vorhanden und brauchbar, aber nicht ueberall serverseitig gekapselt

🟡 Buchungssystem  
- funktioniert, braucht aber robustere Serverarchitektur

🔴 Zahlungslogik  
- faktisch noch nicht implementiert

🟡 Upload-System  
- funktional, aber noch ohne tiefere Missbrauchs-/Inhaltspruefung

🟡 Adminbereich  
- umfangreich, aber monolithisch

🟡 Deployment  
- buildbar, aber noch nicht komplett betrieben wie ein Produktionssystem

🟡 Performance  
- okay fuer MVP, aber noch nicht durchgaengig optimiert

🟡 Sicherheit  
- gute Grundlagen, aber noch nicht gruene Enterprise-Haerte

🟡 Tests  
- Basissignal gut, Abdeckung zu klein

🟡 Environment Setup  
- sauber dokumentiert, aber operativ noch nicht vollstaendig

🟡 Abhaengigkeiten  
- kontrollierbar, aber mit moderaten Audit-Warnungen

🟡 Codequalitaet  
- insgesamt ordentlich, mit sichtbarer technischer Schuld in grossen Komponenten
