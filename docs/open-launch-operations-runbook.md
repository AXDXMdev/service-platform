# Hilfinio Open Launch Operations Runbook

Stand: 17.05.2026

## Purpose

Dieses Runbook beschreibt die minimale Produktions-Governance fuer einen offenen Hilfinio-Launch. Es ergaenzt Code-Gates, Upload-Worker, Abuse Monitoring und Incident Response.

## Release Gates

Vor jedem Production Deploy:

```bash
npm run ci
```

CI prueft:

- Secret Scan
- ESLint
- TypeScript strict
- API/Service Tests
- Next Production Build

## Open Launch Health

Endpoint:

```text
GET /api/health/open-launch
```

Erwartung fuer Open Launch:

```json
{
  "status": "open_launch_ready",
  "blockers": []
}
```

Blocker werden absichtlich hart gemeldet, z. B. fehlende finale Domain, fehlender Cron-Secret oder fehlende Upload-Security-Processor.

## Upload Security Pipeline

Endpoint:

```text
POST /api/cron/upload-processing
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron:

```json
{
  "path": "/api/cron/upload-processing",
  "schedule": "*/10 * * * *"
}
```

Required Env:

- `CRON_SECRET`
- `UPLOAD_AV_SCAN_URL`
- `UPLOAD_AV_SCAN_TOKEN`
- `UPLOAD_IMAGE_SANITIZER_URL`
- `UPLOAD_IMAGE_SANITIZER_TOKEN`

Job Status:

- `queued`: Upload wurde vorgemerkt.
- `processing`: Worker verarbeitet.
- `completed`: Security Checks bestanden.
- `failed`: Worker/Processor-Fehler, manuelle Pruefung noetig.
- `quarantined`: Policy-/AV-/Sanitizer-Risiko, Inhalt nicht vertrauenswuerdig.
- `duplicate`: bereits registrierter Upload.

## Abuse Monitoring

Abuse Reports speichern Spam-Signale in `abuse_reports.metadata`.

Security Events:

- `abuse_report_honeypot`
- `abuse_report_high_spam_score`
- `cron_upload_processing_unauthorized`

Admin Ops Endpoint:

```text
GET /api/admin/ops
```

Zeigt:

- Upload-Failures/Quarantine
- Abuse-Reports nach Status/Kategorie
- Account-Deletions
- Security Events der letzten 24 Stunden

## Incident Response

1. Severity bestimmen:
   - `critical`: Datenleck, Auth-Bypass, Malware, Admin-Kompromittierung.
   - `warning`: Spam-Welle, Upload-Failures, verdächtige Cron-Zugriffe.
   - `info`: normale Betriebsereignisse.
2. Production Health pruefen:
   - `/api/health`
   - `/api/health/open-launch`
   - Vercel Deployment Logs
   - Sentry Issues
3. Sofortmassnahmen:
   - Upload-Worker pausieren: Vercel Cron deaktivieren oder `CRON_SECRET` rotieren.
   - Abuse-Spam: Rate Limits senken oder WAF/Bot-Regeln aktivieren.
   - Admin-Risiko: `ADMIN_PANEL_TOKEN` und `ADMIN_PANEL_PASSWORD` rotieren.
4. Nachbereitung:
   - Security Event dokumentieren.
   - Root Cause festhalten.
   - Test/Policy ergaenzen.

## Rollback

Rollback erfolgt ueber Vercel Deployment History. Vor Rollback pruefen:

- Enthielt das neue Deployment Datenbankmigrationen?
- Sind Migrationen rueckwaertskompatibel?
- Muss ein Feature Flag deaktiviert werden?

## Launch Decision

Open Launch erst freigeben, wenn:

- `/api/health` ready ist.
- `/api/health/open-launch` keine Blocker meldet.
- CI auf `main` gruen ist.
- Upload-Processor produktiv antwortet.
- Admin Ops taeglich geprueft wird.
- Legal Review abgeschlossen ist.
