# Hilfinio Project Cleanup Report

Stand: 2026-05-03

## Zusammenfassung

Der Cleanup wurde konservativ ausgefuehrt. Entfernt wurde nur Code oder Projektballast, der eindeutig ungenutzt, doppelt oder lokal generiert war. Produktive Supabase-Flows, Seiten und aktive Mobile-MVP-Dateien wurden nicht geloescht, wenn ihre Nutzung nicht eindeutig ausgeschlossen werden konnte.

## Entfernt

### Komponenten

- `components/LogoutButton.tsx`
  - Doppelte Logout-Logik. `components/AuthButton.tsx` ist die aktive Navigation-Komponente.
- `components/ServiceBot.tsx`
  - Nicht eingebundener Prototyp. Es gab keine Imports oder Render-Stellen.

### Public Assets

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `public/taskora-logo.png`
- `public/taskora-logo-transparent.png`
- `public/service-marketplace-hero.png`

Diese Dateien hatten keine Referenzen in App, Komponenten, Libs oder Docs. Die aktiven Brand-Assets `hilfino-logo.png` und `hilfino-mark.png` bleiben erhalten.

### Alte SQL-Dumps

- `docs/taskora-supabase-repair-cms-core.sql`
- `docs/taskora-supabase-sql-editor-run.sql`
- `docs/taskora-supabase-step-homepage-sections.sql`

Diese Dateien waren alte, unreferenzierte One-off SQL-Dumps mit veraltetem Projektnamen. Die aktuelle, gepflegte Reparaturdatei ist `docs/supabase-steps/07_admin_rls_theme_fix.sql`; produktive Migrationen liegen in `supabase/migrations/`.

### Lokaler/Geräte-Ballast

- `.DS_Store` Dateien in Root, `app/`, `app/admin/`, `docs/`, `docs/recordings/`, `docs/recordings/tiktok-slides/`
- `mobile/.expo/`

`mobile/.expo/` ist lokaler Expo-Zustand und wurde in `.gitignore` aufgenommen.

## Bereinigt

- Debug-`console.warn` Ausgaben aus `app/admin/login/page.tsx` entfernt.
- `package.json` um `typecheck` Script ergaenzt.
- `README.md` um `npm run typecheck` im Deployment-Check erweitert.
- Alte Taskora-Seed-Texte in `supabase/migrations/*.sql` auf Hilfinio korrigiert.
- `docs/quick-wins-2026-04-25.md` aktualisiert, weil der alte `ServiceBot` entfernt wurde.
- `docs/supabase-steps/07_admin_rls_theme_fix.sql` ist nun robuster und legt fehlende CMS-Tabellen selbst an.
- Der CTA-Farbfix aus der laufenden UI-Arbeit bleibt erhalten und ist in `app/page.tsx`/`app/globals.css` klar isoliert.

## Geaenderte Dateien

- `.gitignore`
- `README.md`
- `package.json`
- `app/admin/login/page.tsx`
- `app/page.tsx`
- `app/globals.css`
- `docs/quick-wins-2026-04-25.md`
- `docs/supabase-steps/07_admin_rls_theme_fix.sql`
- `supabase/migrations/*.sql` mit Hilfinio-Textkorrekturen
- `BACKEND_AUDIT_AND_SUPPORT.md`

## Entfernte Dependencies

Keine. Die Root-Abhaengigkeiten sind klein und aktiv:

- `next`, `react`, `react-dom`
- `@supabase/supabase-js`
- `@vercel/speed-insights`

Mobile-Abhaengigkeiten sind fuer das Expo-MVP erforderlich und wurden nicht entfernt.

## Backend-Verbesserungen

- Alte Taskora-Defaults in Migrationen korrigiert.
- Admin-CMS-RLS-Reparaturdatei stabilisiert, damit fehlende CMS-Tabellen vor Policy-Erstellung angelegt werden.
- Keine sensiblen Server-Logs entfernt: `lib/serverLogger.ts` nutzt bewusst `console.error`/`console.warn` als zentrale, redacted Server-Logging-Schicht.
- Support-/Admin-APIs aus dem vorherigen Backend-Audit bleiben strukturiert ueber `lib/apiResponse.ts`, `lib/serverSupabase.ts` und `lib/serverLogger.ts`.

## Frontend-Verbesserungen

- Nicht eingebundene UI-Prototypen entfernt.
- Doppelte Logout-Komponente entfernt; aktive Auth-Navigation bleibt in `AuthButton`.
- Unbenutzte Public Assets entfernt.
- Debug-Ausgaben aus Admin-Login entfernt.
- Mobile CTA bleibt sichtbar und lesbar durch isolierte `provider-cta` Klassen.

## Bewusst Nicht Geloescht

- `docs/recordings/**`
  - Unreferenziert im Code, aber moeglicherweise Marketing-/Review-Artefakte. Nicht geloescht, weil keine eindeutige Zustimmung zur Entfernung von Medienartefakten vorlag.
- `docs/supabase-steps/06_rebrand_hilfino.sql`
  - Enthaelt bewusst ein Rebrand-Skript, das alte `Taskora` Daten in Hilfinio umschreibt.
- Route-Layouts wie `app/services/layout.tsx`, `app/create-service/layout.tsx`, `app/service/[id]/layout.tsx`
  - Werden durch Next.js Dateikonventionen genutzt, auch wenn sie nicht importiert werden.
- Mobile Mockdaten
  - `mobile/src/data/mockData.ts` ist aktiv fuer das Expo-MVP und klar als Mockdaten-Schicht dokumentiert. Nicht produktiv mit echten Daten verwechseln.
- Clientseitige Supabase-Mutationen
  - Aktuell funktional und RLS-abhaengig. Eine Umstellung auf serverseitige APIs waere ein groesserer Architektur-Schritt und wurde nicht als Cleanup-Nebenwirkung umgesetzt.

## Risiken / Offene TODOs

- `npm audit` meldet moderate Transitiv-Advisories in Next/Expo. Der angebotene Fix ist nur per `--force` und wuerde breaking Downgrades ausloesen. Nicht automatisch angewendet.
- Es gibt weiterhin keine echte Test-Suite. `npm test --if-present` laeuft durch, weil kein Test-Script definiert ist.
- Direkte Supabase-Client-Writes sollten fuer kritische Flows schrittweise in serverseitige APIs ueberfuehrt werden.
- Rechtliche Platzhalterdaten im Impressum bleiben ein Launch-Blocker.
- `docs/recordings/**` sollte spaeter entweder in ein separates Asset-Archiv verschoben oder bewusst versioniert bleiben.

## Ausgefuehrte Checks

Root:

```bash
npm run lint
npm run typecheck
npm run build
npm test --if-present
npm audit --omit=dev --audit-level=moderate
```

Mobile:

```bash
cd mobile
npm run typecheck
npm audit --omit=dev --audit-level=moderate
```

Ergebnis:

- `lint`: erfolgreich
- `typecheck`: erfolgreich
- `build`: erfolgreich
- `mobile typecheck`: erfolgreich
- `npm test --if-present`: erfolgreich, aber keine Tests vorhanden
- `npm audit`: moderate Advisories bleiben offen, kein sicherer non-breaking Fix verfuegbar

## Lokale Befehle

Website:

```bash
cd /Users/alaadinadem/service-platform
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

Mobile:

```bash
cd /Users/alaadinadem/service-platform/mobile
npm install
npm run typecheck
npm run ios
```

## Livegang-Einschaetzung

Der Code ist nach diesem Cleanup sauberer und besser wartbar. Fuer den naechsten Schritt Richtung Livegang ist die Basis solide genug, solange folgende Punkte vor Produktionsstart erledigt werden:

- Rechtstexte/Impressum finalisieren.
- Supabase-Migrationen und RLS im Zielprojekt testen.
- Audit-Advisories weiter beobachten und ohne breaking Downgrade patchen, sobald moeglich.
- Mindest-Teststruktur fuer Backend-Routen und kritische Flows einfuehren.
