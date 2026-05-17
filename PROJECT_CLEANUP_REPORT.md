# Hilfinio / Taskora - Cleanup Report

Stand: 2026-05-17

## Durchgefuehrte Cleanup- und Qualitaetsmassnahmen

- Zentrale Env-Konfiguration mit Zod in `lib/env.ts`.
- Zentrale Request-Hardening-Helfer in `lib/requestSecurity.ts`.
- JSON Body Parsing aus vielen Routen vereinheitlicht.
- Zod-basierte Validierung fuer Requests, Statuswechsel, Offers, Favorites, Chat, Provider Verification, Waitlist, Reviews, Service Creation und Upload Grants.
- Betreiber-/Legal-Platzhalter fuer Adresse, Hosting und VSBG zentral ersetzt.
- `app/loading.tsx` fuer App-Router Loading UX ergaenzt.
- `app/manifest.ts` fuer PWA-Grundlage ergaenzt.
- `.env.example` um Mindestlaengen fuer Admin Secrets erweitert.

## Weiterhin gefundene Cleanup-Themen

### 🔴 Kritisch

- Mobile Mock Mode muss vor Mobile Launch entfernt oder klar als Dev-Modus isoliert werden:
  - `mobile/src/api/client.ts`
  - `mobile/src/data/mockData.ts`
  - `mobile/src/services/*`

### 🟠 Wichtig

- Viele Pages sind noch grosse Client Components. Refactor in Server Components + Client Islands bleibt Top-Prioritaet.
- CMS Action Payloads brauchen spezifische Zod Schemas statt nur Action-String-Guards.
- Vorhandene historische Reports sollten konsolidiert werden, damit Launch-Status eindeutig bleibt.

### 🟡 Mittel

- `serverLogger` nutzt bewusst `console.*` als Logging Sink. Das ist kein Debug-Console-Log, sollte aber in Production an ein externes Logging-Ziel angebunden werden.
- Segment-spezifische Loading States fehlen.
- Tests sind gut fuer Route Units, aber E2E fehlt.

## Verifikation

- `npm run lint`: gruen
- `npm run typecheck`: gruen
- `npm test`: gruen, 45 bestanden, 1 Supabase Integration Skip
- `npm run build`: gruen

## Cleanup Score

Aktueller Maintainability Score: 7/10.

Mit Server-Component-Refactor, Mobile Mock Removal und verteiltem Rate Limit waere 8.5/10 realistisch.
