# Hilfinio / Taskora - Mobile Readiness Report

Stand: 2026-05-17

## Implementiert

- Mobile Demo/Mock Mode ist nicht mehr stillschweigend aktiv:
  - `EXPO_PUBLIC_ENABLE_DEMO_MODE=false` in `mobile/.env.example`
  - `requireConfiguredMobileBackend()` verhindert Mock-Fallbacks ohne expliziten Demo-Modus
  - Endpoint-TODOs in `mobile/src/api/client.ts` wurden durch echte Integrationsbeschreibung ersetzt
- PWA Manifest fuer Web App ist vorhanden.
- Globaler Loading Fallback ist vorhanden.

## Mobile Status

Web:

- installierbare Grundlage vorhanden
- Touch-/Responsive-Struktur bereits weitgehend vorhanden
- Service/Request-Flows bleiben unveraendert

Expo:

- Supabase Auth/Services/Requests sind teilweise echt angebunden.
- Demo-Daten sind nur noch explizit per Env erlaubt.

## Noch offen

- Native Support/Report API final verdrahten.
- Offline Queue fuer Request Drafts.
- Push Notification Struktur.
- iOS Safari Visual QA.
- Android Chrome Visual QA.
- Keyboard Avoiding und Form-Fokus in Expo pruefen.

## Mobile Score

Web PWA: 78/100

Expo App: 62/100 bis alle Mock-/Demo-Flows ersetzt und QA abgeschlossen sind.
