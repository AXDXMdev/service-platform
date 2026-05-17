# Hilfinio / Taskora - Observability Report

Stand: 2026-05-17

## Implementiert

- `lib/observability.ts`
  - strukturierte Observability Events
  - optionale Sentry Envelope Ausgabe ueber `SENTRY_DSN` oder `NEXT_PUBLIC_SENTRY_DSN`
  - optionaler Custom Ingest ueber `OBSERVABILITY_INGEST_URL`
  - Secret-/PII-Redaction

- `components/ClientErrorReporter.tsx`
  - Browser `error` Listener
  - `unhandledrejection` Listener
  - sendBeacon/fetch an `/api/observability`

- `/api/observability`
  - rate-limited
  - JSON validiert
  - sendet an Sentry/Custom Ingest

- `lib/serverLogger.ts`
  - Server Error Logs werden zusaetzlich an Observability weitergeleitet

- Health Check:
  - Production Readiness meldet fehlende externe Observability.

## Dashboard-ready Signale

Vorbereitet fuer:

- uptime via `/api/health`
- frontend errors via `/api/observability`
- backend errors via `serverLogger`
- auth failures ueber Admin Login Rate Limit und Logs
- suspicious traffic ueber `security_events`
- upload pipeline ueber `upload_processing_jobs`
- reports/abuse ueber `abuse_reports`
- bookings/requests ueber bestehende Request Tabellen

## Noch zu tun

- Sentry SDK kann spaeter ergaenzt werden, wenn Paketinstallation und Source Maps/Release Tracking gewuenscht sind.
- Vercel Logs/Drains oder OpenTelemetry Exporter anbinden.
- Alert-Regeln definieren:
  - 5xx Rate
  - Auth Failure Spike
  - Upload Quarantine Spike
  - Abuse Report Spike
  - Request Creation Drop

## Observability Score

Aktuell: 72/100

Mit aktivem Sentry DSN, Log Drain und Alerting: 88/100.
