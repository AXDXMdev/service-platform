# Hilfinio Backend Audit & Support

Stand: 2026-05-03

## Kurzfazit

Das Backend besteht aktuell aus Next.js Route Handlern und Supabase als Auth-, Datenbank- und Storage-Backend. Viele fachliche Mutationen laufen noch direkt aus Client-Komponenten gegen Supabase und verlassen sich auf RLS. Das ist fuer einen fruehen MVP tragbar, sollte aber fuer Support-, Admin- und sicherheitskritische Workflows schrittweise in serverseitige APIs ueberfuehrt werden.

## Gefundene Probleme

- API-Antworten waren uneinheitlich: einige Routen gaben `{ ok, message }`, andere fachliche Daten direkt zurueck.
- Technische Supabase-Fehler konnten an Clients weitergegeben werden, z. B. beim Rollencheck.
- Es gab keine zentrale Server-Logging-Hilfe mit Redaction.
- Admin-/Support-Abfragen hatten keine serverseitige Support-API und keine Support-Felder auf `requests`.
- `SUPABASE_SERVICE_ROLE_KEY` war nicht dokumentiert, obwohl eine sichere serverseitige Support-API dafuer benoetigt wird.
- Default-CMS-Texte in `lib/siteSettings.ts` nutzten teils noch den alten Namen `Hilfinio` nicht konsistent.
- Keine Teststruktur fuer Backend-Routen vorhanden.

## Behobene Probleme

- Einheitliche API-Helfer in `lib/apiResponse.ts` eingefuehrt.
- Server-Logging mit Redaction in `lib/serverLogger.ts` eingefuehrt.
- Serverseitige Supabase-Client-Helfer in `lib/serverSupabase.ts` eingefuehrt.
- `/admin/session`, `/admin/role` und `/api/site-settings` auf einheitlichere Response-Struktur und sicherere Fehlermeldungen umgestellt.
- `/api/admin/support` als admin-geschuetzte Support-API vorbereitet.
- Migration `20260503_support_hardening.sql` fuer Support-Felder und Audit-Events ergaenzt.
- Environment-Doku um `SUPABASE_SERVICE_ROLE_KEY` erweitert.
- Hilfinio-Default-Texte in `lib/siteSettings.ts` korrigiert.

## Backend-Struktur

- `app/api/site-settings/route.ts`: oeffentliche CMS-/Theme-Konfiguration mit Fallbacks.
- `app/admin/session/route.ts`: Admin-Session-Cookie nach Admin-Key-Pruefung.
- `app/admin/role/route.ts`: Rollencheck fuer eingeloggte Supabase-Nutzer.
- `app/api/admin/support/route.ts`: serverseitige Support-Liste fuer Anfragen/Leads.
- `lib/apiResponse.ts`: einheitliche API-Erfolg-/Fehlerantworten.
- `lib/serverLogger.ts`: serverseitiges Logging mit Redaction.
- `lib/serverSupabase.ts`: serverseitige Supabase Public/Admin Clients.
- `lib/validation.ts`: zentrale einfache Validierung/Normalisierung.
- `lib/requestWorkflow.ts`: Request-Statuslogik und Event-Logging.
- `supabase/migrations/`: Datenbankschema, RLS, Storage-Policies und Support-Erweiterungen.

## Wichtige API-Endpunkte

### `GET /api/site-settings`

Antwort:

```json
{
  "ok": true,
  "data": {
    "theme": {},
    "site": {},
    "sections": [],
    "content": {}
  },
  "warnings": []
}
```

### `GET /admin/session`

Prueft Admin-Cookie. Gibt bei fehlender/ungueltiger Session `401` zurueck.

### `POST /admin/session`

Erwartet JSON:

```json
{ "password": "ADMIN_PANEL_PASSWORD" }
```

Setzt ein `httpOnly` Admin-Cookie mit `ADMIN_PANEL_TOKEN`.

### `DELETE /admin/session`

Loescht das Admin-Cookie.

### `GET /admin/role`

Erwartet Supabase Bearer Token im `Authorization` Header. Liefert nur die Rolle, keine Profildetails.

### `GET /api/admin/support`

Voraussetzungen:

- gueltiges Admin-Cookie
- `SUPABASE_SERVICE_ROLE_KEY`
- Migration `20260503_support_hardening.sql`

Query-Parameter:

- `q`: Suche in Request-ID, Kunden-E-Mail, Service-Titel, Anbietername, Stadt, Status.
- `status`: Filter auf Request-Status.
- `priority`: `low`, `normal`, `high`, `urgent`.
- `limit`: 1 bis 100, Default 50.

## Environment Variables

Pflicht fuer Website:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PANEL_PASSWORD`
- `ADMIN_PANEL_TOKEN`

Pflicht fuer Support-API:

- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `NEXT_PUBLIC_GOOGLE_ADS_CLIENT`
- `NEXT_PUBLIC_GOOGLE_ADS_SLOT_HOME`
- `NEXT_PUBLIC_GOOGLE_ADS_SLOT_SERVICES`

Wichtig: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PANEL_PASSWORD` und `ADMIN_PANEL_TOKEN` duerfen niemals in Client-Code oder mit `NEXT_PUBLIC_` Prefix verwendet werden.

## Datenbank & Models

Zentrale Tabellen:

- `profiles`: Nutzerrolle, Verifizierungsstatus, interne Notizen.
- `services`: Anbieterleistungen, Medien, Standort, Sichtbarkeit, Premium/Boost-Felder.
- `requests`: Leads/Buchungsanfragen, Status, Preise, Support-Felder.
- `request_events`: nachvollziehbare Statusaenderungen.
- `reviews`: Bewertungen mit optionalem Proof-Workflow.
- `favorites`: gespeicherte Services.
- `chat_messages`: Anfrage-bezogene Nachrichten.
- `provider_verification_requests`: Nachweis-/Verifizierungsprozess.
- `support_audit_events`: vorbereitete Audit-Events fuer Supportaktionen.

Neue Support-Felder auf `requests`:

- `internal_notes`
- `assigned_to`
- `priority`

## Sicherheit

Umgesetzt:

- Admin-Session benoetigt getrenntes `ADMIN_PANEL_PASSWORD` und `ADMIN_PANEL_TOKEN`.
- Admin-Cookie ist `httpOnly`, `sameSite=lax`, in Production `secure`.
- Support-API nutzt keinen Admin-Bypass im Browser, sondern serverseitig `SUPABASE_SERVICE_ROLE_KEY`.
- API-Fehler geben keine Supabase-Fehlerdetails mehr an Clients aus.
- Logging redacted sensitive Keys wie Token, Cookie, Password, Secret.
- Security Header und CSP sind in `next.config.ts` gesetzt.

Weiter offen:

- Clientseitige Supabase-Mutationen sollten fuer kritische Flows in Server APIs ueberfuehrt werden.
- Rate-Limiting ist aktuell nur fuer Admin-Login in-memory vorbereitet; fuer Production besser Upstash/Vercel Firewall oder Supabase Edge Rate Limits verwenden.
- Support-API ist Read-only. Schreibende Supportaktionen brauchen explizite Audit-Events.

## Support-Workflow

Vorgeschlagener Ablauf:

1. Support/Admin meldet sich ueber `/admin/login` an.
2. Supportliste ruft `GET /api/admin/support?q=&status=&priority=` ab.
3. Support sieht Request, Status, Kunde, Anbieter/Service, Betraege, interne Notizen, Prioritaet und Zuweisung.
4. Statusaenderungen bleiben ueber `request_events` nachvollziehbar.
5. Kuenftige Support-Schreibaktionen sollen parallel in `support_audit_events` protokollieren.

## Tests

Aktuell gibt es keine Teststruktur fuer Backend-Routen.

TODO-Vorschlag:

- `vitest` und `@testing-library/react` fuer reine Helfer/Validierung.
- Route-Handler-Tests fuer:
  - `GET /api/site-settings` mit Env-Fallback.
  - `POST /admin/session` erfolgreich.
  - `POST /admin/session` mit falschem Content-Type.
  - `GET /admin/role` ohne Authorization.
  - `GET /api/admin/support` ohne Admin-Cookie.
  - `GET /api/admin/support` ohne `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase-RLS Integrationstests separat gegen ein Testprojekt oder lokale Supabase Instanz.

## Offene Risiken

- Rechtliche Dummy-Daten im Impressum sind weiterhin Launch-blockierend, auch wenn sie nicht Backend-spezifisch sind.
- Service Role Key muss im Hosting korrekt als server-only Secret gesetzt werden.
- Migrationen muessen in Reihenfolge auf dem Zielprojekt laufen.
- Direkte Client-Supabase-Zugriffe sind wartbar nur, solange RLS konsequent getestet wird.
- `npm audit` meldet moderate advisories in Next/Expo-Transitivdependencies; Fix wird aktuell nur als breaking downgrade/force angeboten.

## Naechste Schritte

1. Migration `20260503_support_hardening.sql` auf Supabase ausfuehren.
2. `SUPABASE_SERVICE_ROLE_KEY` in Vercel/Hosting setzen.
3. Kleine Admin-Support-UI auf Basis von `/api/admin/support` bauen.
4. Schreibende Supportaktionen mit `support_audit_events` umsetzen.
5. Kritische Client-Mutationen schrittweise in serverseitige Route Handler verlagern.
6. Teststruktur einfuehren und Route Handler automatisiert pruefen.
