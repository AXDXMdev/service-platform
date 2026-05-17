# Hilfinio / Taskora - Security Audit

Stand: 2026-05-17

## Status

Security Status: 🟠 verbessert, aber noch nicht vollstaendig production-hardened fuer offenen Traffic.

## Implementiert in diesem Durchlauf

- `lib/requestSecurity.ts`
  - `requireSameOrigin()` fuer Admin-Cookie-Mutationsschutz.
  - `requireJsonContentType()` und `readJsonBody()` fuer konsistente JSON-only Mutationen.
- Admin Login/CMS/Moderation schuetzen cookiebasierte POSTs gegen Cross-Origin Requests.
- Kern-Mutationsrouten lesen JSON nun ueber zentralen Guard statt ad hoc `request.json().catch(...)`.
- `lib/env.ts` validiert zentrale Env-Werte mit Zod und meldet Production-Readiness-Probleme.
- Health-Route gibt `checks.productionReadiness` aus.
- Admin Secret Mindestlaengen werden bewertet.

## 🔴 Kritisch

- Rate Limiting ist nur pro Prozess. `Map`-basierte Limits reichen nicht fuer Vercel/Serverless oder mehrere Regionen.
- Uploads erhalten Signed Upload URLs; nach Upload fehlt serverseitige Validierung des tatsaechlichen Objekts.
- Kein zentraler Bot-/Spam-Dienst, keine CAPTCHA-/Turnstile-Integration fuer Abuse-, Waitlist-, Login- und Report-Flows.

## 🟠 Wichtig

- CSP nutzt weiterhin `'unsafe-inline'`. Empfohlen: Next-16 Nonce-CSP ueber `proxy.ts`, danach Inline-Scripts/Styles gezielt noncen.
- Admin-Cookie ist `httpOnly`, `secure` in Production und `sameSite=lax`. Fuer besonders sensitive Admin-Aktionen kann zusaetzlich ein CSRF Token pro Session eingefuehrt werden.
- Admin-APIs authentifizieren ueber separaten Panel-Cookie. Fuer Multi-Admin-Betrieb sollte das langfristig an Supabase-Rollen und MFA gekoppelt werden.
- Service Role Key wird serverseitig verwendet. Audit muss sicherstellen, dass keine Server-Only Imports in Client Components gelangen.
- Logs sind strukturiert, aber kein externes Security Monitoring/Alerting angebunden.

## 🟡 Mittel

- RLS ist breit vorhanden, aber Policies sind historisch ueber mehrere Migrationen verteilt. Empfehlenswert ist ein finaler Policy-Snapshot.
- `abuse_reports` erlaubt anonyme Inserts ueber Service Role API; das ist produktlogisch ok, braucht aber Abuse Protection.
- Account Deletion fuehrt mehrere Deletes aus. Fuer groessere Datenmengen braucht es idempotente Jobs und Audit Events.
- Export/Deletion sollten E2E mit echten Supabase-Testdaten validiert werden.

## 🟢 Gut

- Supabase Service Role wird nicht an Browsercode exponiert.
- Public/Admin Supabase Clients sind getrennt.
- RLS fuer wichtige Tabellen ist aktiviert.
- Storage Buckets haben MIME-/Size-Konfigurationen.
- Security Headers in `next.config.ts` vorhanden: frame deny, nosniff, referrer policy, permissions policy, CSP.
- Report Abuse und Account Rights Flows existieren.

## RLS Audit

Vorhandene RLS-Bereiche:

- `profiles`, `services`, `requests`, `request_events`, `reviews`, `waitlist_entries`
- `favorites`, `chat_messages`
- `provider_verification_requests`
- CMS Tabellen: `site_settings`, `theme_settings`, `homepage_sections`, `site_content`, `cms_categories`, `page_contents`
- DSA/DSGVO Tabellen: `account_deletion_requests`, `abuse_reports`
- Storage Policies fuer `service-media` und `site-assets`

Risiko:

- Policies werden mehrfach gedroppt/repariert. Fuer Launch sollte eine konsolidierte Migration oder ein Supabase schema dump als Source of Truth eingefroren werden.

## Empfehlung Naechste Schritte

1. Verteiltes Rate Limit mit Redis/KV einfuehren.
2. Turnstile/CAPTCHA fuer anonyme und high-risk Mutationen.
3. Strict CSP mit Nonces und ohne `'unsafe-inline'`.
4. Upload Post-Processing Job: MIME sniffing, Bilddekodierung, EXIF-Strip, Moderation, Quarantaene.
5. Admin Actions mit Audit Event Tabelle vereinheitlichen.
6. Supabase RLS Integrationstest mit echter Testdatenbank in CI aktivieren.
