# Hilfinio / Taskora - Full Project Audit

Stand: 2026-05-17

## Executive Summary

Das Projekt ist bereits deutlich naeher an Launch Readiness als ein MVP-Rohbau: App Router, zentrale Services, Supabase RLS-Migrationen, Admin-CMS-Module, DSA-/DSGVO-Flows, Tests und Security Headers sind vorhanden. Die groessten Risiken liegen nicht in fehlender Grundfunktion, sondern in Skalierungshaertung, Mobile-Reife, konsequenter Server-Component-Architektur und operationaler Absicherung.

In diesem Durchlauf umgesetzt:

- zentrale Env-Validierung mit Zod in `lib/env.ts`
- zentrale Request-Security-Helfer in `lib/requestSecurity.ts`
- JSON-Content-Type-Hardening fuer zentrale Mutationsrouten
- Same-Origin-Schutz fuer Admin-Cookie-Mutationen
- Zod-basierte Validierung fuer Kern-Domaeneninputs
- Legal-Betreiberadresse und Hosting/VSBG-Daten ergaenzt
- globaler `app/loading.tsx` Fallback
- PWA Manifest via `app/manifest.ts`
- Health-Check um Production-Readiness-Issues erweitert

## Projektfakten

- 182 relevante TS/TSX/MJS/SQL-Dateien in App, Services, Lib, Mobile, Tests und Supabase.
- 27 App-Router Pages.
- 28 Route Handler.
- 50 Client Components/Client Pages.
- RLS-Migrationen fuer Profile, Services, Requests, Reviews, Favorites, Chat, CMS, Uploads, Abuse und Account Deletion vorhanden.
- Baseline nach Aenderungen: Lint, Typecheck, Tests und Build gruen.

## Priorisierte Befunde

### 🔴 Kritisch

- Kein verteiltes Rate Limiting: `lib/serverRateLimit.ts` nutzt einen in-memory `Map`. Auf Vercel/Serverless skaliert das pro Instance und schuetzt nicht zuverlaessig gegen verteilten Abuse.
- Mobile App nutzt noch Mock-Fallbacks (`mobile/src/api/client.ts`, `mobile/src/services/*`). Fuer Launch muss Supabase/API-Integration vollstaendig sein.
- Viele Top-Level Pages sind Client Components (`app/page.tsx`, `app/services/page.tsx`, Dashboard, Auth, Detailseiten). Das erhoeht Bundle und Hydration-Kosten und erschwert Data-Minimization.
- Keine vollstaendige E2E-Abdeckung fuer Buchungs-/Request-Pipeline, Account-Loeschung, Datenexport, Abuse-Workflow und Admin-CMS.

### 🟠 Wichtig

- Admin-CMS ist modularisiert, aber noch stark clientseitig. Server Actions/Form Actions waeren fuer CMS-Mutationen wartbarer und wuerden API-Oberflaeche reduzieren.
- CSP ist vorhanden, nutzt aber fuer Scripts noch `'unsafe-inline'`. Fuer strikte CSP sollte Next-16-Nonce-Flow ueber `proxy.ts` eingefuehrt werden.
- Upload-Validierung prueft MIME/Extension/Size, aber keine echte serverseitige Bild-/Mediendekodierung oder Malware-/NSFW-Moderation.
- Consent wird lokal gespeichert; fuer revisionssichere Nachweise bei registrierten Nutzern fehlt serverseitige Consent-Historie.
- DSA/DSGVO-Flows existieren, aber SLA-/Statuslogik und Admin-Audittrail sind noch ausbaufaehig.
- Monitoring/Tracing ist minimal. Speed Insights ist eingebunden, aber kein Error Monitoring, Alerting, SLO-Dashboard oder Audit-Event-Schema fuer alle kritischen Aktionen.

### 🟡 Mittel

- `app/loading.tsx` ist jetzt global vorhanden; segment-spezifische Loading States fuer Dashboard, Services, Detailseiten und Admin fehlen noch.
- API Validierung ist jetzt zentraler und Zod-basiert fuer Kernflows; CMS-Actions brauchen noch tiefere Payload-Schemas pro Aktion.
- Public Catalog APIs koennen noch staerker gecacht werden, sobald Dateninvalidierung ueber CMS-/Service-Mutationen stabil ist.
- Legal-Seiten sind brauchbar, muessen aber vor Launch juristisch geprueft werden.
- Mobile PWA-Grundlage ist vorhanden, aber Service Worker/Offline-Queue/Push-Opt-in sind noch nicht implementiert.

### 🟢 Nice-to-have

- AI-Ready Hooks sollten als Queue-/Moderation-Service abstrahiert werden.
- Provider Quality Score, Trust Badges und Admin Insights koennen staerker datengetrieben werden.
- SEO kann durch strukturierte Daten pro Service, Kategorie-Landingpages und hreflang/i18n-Ausbau verbessert werden.

## Architektur

Gut:

- Services in `services/` trennen Businesslogik bereits von Routen.
- API Responses sind einheitlich ueber `lib/apiResponse.ts`.
- Supabase Server/Public/Admin Clients sind gekapselt.
- Admin-Funktionen sind in Module zerlegt.

Problematisch:

- Viele Pages starten mit `"use client"` und enthalten Datenfluss, State und UI in einer Datei.
- Server Components werden nicht konsequent als Data Access Layer genutzt.
- `lib/supabaseClient.ts` initialisiert den Browserclient am Modul-Scope und wirft bei fehlender Env. Fuer rein statische Seiten ist das okay, aber robuste Client-Degradation waere besser.

Empfehlung:

- Public/Home/Services/Detailseiten in Server Shell + kleine Client Islands splitten.
- Server Actions fuer interne Mutationen evaluieren.
- DTO-Schicht pro Domain festziehen: `services -> DTO -> UI`.

## Security

Umgesetzt:

- Admin-Cookie-Routen sind Same-Origin-geschuetzt.
- Mutationsrouten verlangen JSON Content-Type.
- Env-Readiness prueft Mindestlaengen fuer Admin Secrets.
- Service Role bleibt serverseitig in `lib/serverSupabase.ts`.

Offen:

- Verteiltes Rate Limit mit Upstash Redis/Vercel KV/Supabase RPC.
- Strikte CSP ohne `'unsafe-inline'`.
- Upload-Sanitization und AI-/Human-Moderation Pipeline.
- Vollstaendige Admin-Audit-Events fuer CMS, Moderation, Account-Rechte und Support.

## DSGVO / DSA

Vorhanden:

- Impressum, Datenschutzerklaerung, AGB, Plattformbeschwerden.
- Betreiber: Alaadin Adem, Stubaier Strasse 18, 70327 Stuttgart, Deutschland.
- Datenexport-Route.
- Account-Loeschungsroute.
- Abuse-/Report-Route und Admin Compliance Dashboard.
- Consent Banner und lokale Consent Settings.

Offen:

- Juristische Endpruefung.
- Serverpersistente Consent-Historie fuer eingeloggte Nutzer.
- Formale DSA Kontaktstelle/Prozess-SLAs im Admin.
- Datenverarbeitungsverzeichnis und AV-Vertraege ausserhalb des Codes.

## Performance / UX / Conversion

Gut:

- Next 16.2.4, React 19.2.4.
- Build ist schnell und erfolgreich.
- Image Remote Patterns sind auf Supabase Storage begrenzt.
- Public Settings API cached kurz mit stale-while-revalidate.

Problematisch:

- Zu viele Client Pages.
- Keine route-spezifischen Skeletons fuer alle kritischen Flows.
- Noch keine Bundle-Analyse.
- Mobile App und Web-PWA sind noch nicht vollstaendig app-like.

## Tote Dateien / Mock Data / Doppelte Logik

- `mobile/src/data/mockData.ts` und `mobile/src/api/client.ts` sind fuer Launch kritisch, solange Mobile als echte App beworben wird.
- Mehrere vorhandene Audit-Reports koennen konsolidiert werden, damit Produkt-/Security-Status nicht widerspruechlich wird.
- Einige Legal-Texte und Hinweise waren Platzhalter-getrieben; Betreiber/Hosting/VSBG wurden in diesem Durchlauf zentralisiert.

## Launch-Risiko

Aktueller technischer Launch-Status: bedingt launchfaehig fuer kontrollierte Pilotphase, nicht fuer offenen Massenmarkt ohne verteiltes Rate Limit, Monitoring, Mobile-Finalisierung und juristische Endabnahme.
