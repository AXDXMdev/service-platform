# Hilfinio

Lokaler Service-Marktplatz auf Basis von Next.js App Router, Supabase Auth/DB/Storage und Vercel Speed Insights.

## Website Starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Die Website läuft lokal unter [http://localhost:3000](http://localhost:3000).

Vor einem Deployment:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Für die neue Live-Supabase-Integrationsspur:

```bash
npm run test:integration
```

Der Lauf nutzt echte Supabase-/RLS-Pfade und braucht zusätzlich `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Ohne diesen Key skipped die Suite bewusst sauber.

## Environment Variables

Pflicht:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Projekt-URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key. Nur mit korrekt aktivierten RLS-Policies verwenden.
- `NEXT_PUBLIC_SITE_URL`: Kanonische Website-URL, z. B. `https://www.hilfinio.de`.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only Key für Admin-/Support-APIs. Nie mit `NEXT_PUBLIC_` prefixen.
- `ADMIN_PANEL_PASSWORD`: Admin-Login-Schlüssel, nicht wiederverwenden.
- `ADMIN_PANEL_TOKEN`: Separates, langes Cookie-Token für die Admin-Session.

Optional:

- `NEXT_PUBLIC_GOOGLE_ADS_CLIENT`
- `NEXT_PUBLIC_GOOGLE_ADS_SLOT_HOME`
- `NEXT_PUBLIC_GOOGLE_ADS_SLOT_SERVICES`

Keine echten Secrets committen. `.env.local` bleibt ignoriert, `.env.example` enthält nur leere Platzhalter.

## Supabase

Die Migrationen liegen in `supabase/migrations/`. Vor Launch müssen alle Migrationen im Zielprojekt ausgeführt sein, insbesondere RLS-Policies für `services`, `requests`, `reviews`, `favorites`, `chat_messages`, `profiles`, `support_audit_events` und Storage-Bucket `service-media`.

## Launch-Dokumente

- [HILFINIO_GREEN_STATUS_REPORT.md](/Users/alaadinadem/service-platform/HILFINIO_GREEN_STATUS_REPORT.md:1)
- [LEGAL_LAUNCH_READINESS_AUDIT.md](/Users/alaadinadem/service-platform/LEGAL_LAUNCH_READINESS_AUDIT.md:1)
- [HILFINIO_LAUNCH_OPERATIONS_CHECKLIST.md](/Users/alaadinadem/service-platform/HILFINIO_LAUNCH_OPERATIONS_CHECKLIST.md:1)
- [docs/open-launch-checklist.md](/Users/alaadinadem/service-platform/docs/open-launch-checklist.md:1)
- [content/social/](/Users/alaadinadem/service-platform/content/social/handles-checklist.md:1)

## Open Launch

Vor einem öffentlichen Launch:

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Zusätzlich prüfen:

- Rechtstexte und Plattformrolle juristisch final freigeben lassen (`TODO_LEGAL_REVIEW`).
- Google Search Console für `hilfinio.de` und `www.hilfinio.de` einrichten.
- Supabase-Migrationen, RLS und Storage-Bucket im Live-Projekt verifizieren.
- Sentry, Vercel Logs, Speed Insights und Abuse Reports in Woche 1 täglich prüfen.
- Domains, HTTPS, Canonicals, Sitemap und robots.txt nach DNS-Änderungen erneut testen.

## Backend Support API

`GET /api/admin/support` liefert eine gefilterte Support-Liste für Anfragen/Leads. Voraussetzungen:

- gültige Admin-Session über `/admin/session`
- `SUPABASE_SERVICE_ROLE_KEY` serverseitig gesetzt
- Migration `20260503_support_hardening.sql` ausgeführt

Query-Parameter: `q`, `status`, `priority`, `limit`.

## Mobile MVP

Eine Expo-Vorversion liegt in `mobile/`.

```bash
cd mobile
npm install
npm run ios
```

Die App nutzt bewusst gekennzeichnete Mockdaten und ist für spätere API-Anbindung vorbereitet.
