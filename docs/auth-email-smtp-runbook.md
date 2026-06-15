# Hilfinio Auth E-Mail SMTP Runbook

Ziel: Supabase Auth bleibt das Auth-System. Supabase versendet Auth-Mails aber ueber einen eigenen Transactional-Mailanbieter mit Hilfinio-Absenderdomain.

## Empfehlung

Fuer Hilfinio zuerst Resend verwenden, wenn schnelle Developer Experience wichtiger ist. Postmark verwenden, wenn maximale Transactional-Mail-Zuverlaessigkeit und bessere Deliverability-Diagnose wichtiger sind.

Keine Provider-SDKs in den Hilfinio-Frontend-Code einbauen. Custom SMTP wird in Supabase konfiguriert.

## Domain und Absender

Empfohlen:

- Absenderdomain: `mail.hilfinio.de` oder `notify.hilfinio.de`
- From Name: `Hilfinio`
- From Email: `no-reply@hilfinio.de`
- Reply-To: `support@hilfinio.de`

DNS beim Mailanbieter einrichten und verifizieren:

- SPF
- DKIM
- DMARC
- optional Return-Path/Bounce-Domain, falls vom Anbieter angeboten

DMARC mindestens mit Monitoring starten:

```txt
v=DMARC1; p=none; rua=mailto:postmaster@hilfinio.de; adkim=s; aspf=s
```

Nach stabiler Zustellung auf `quarantine` oder `reject` haerten.

## Supabase Custom SMTP

Supabase Dashboard:

`Authentication -> Settings -> SMTP / Custom SMTP`

Eintragen:

- SMTP Host: vom Anbieter
- SMTP Port: meist `587`
- SMTP Username: vom Anbieter
- SMTP Password/API Key: nur im Supabase Dashboard speichern
- Sender Name: `Hilfinio`
- Sender Email: `no-reply@hilfinio.de`

Secrets niemals im Repository, in `.env.local`, im Frontend oder in Vercel speichern, wenn Supabase selbst die Mail versendet.

## Supabase URL Configuration

Supabase Dashboard:

`Authentication -> URL Configuration`

Setzen:

- Site URL: `https://hilfinio.de`
- Redirect URLs:
  - `https://hilfinio.de/**`
  - `https://www.hilfinio.de/**`
  - `http://localhost:3000/**`
  - `https://staging.hilfinio.de/**`, falls Staging aktiv ist

## Email Templates

Supabase Dashboard:

`Authentication -> Email Templates`

Alle Templates branden:

- Confirm signup
- Magic Link / OTP
- Reset Password
- Change Email Address

Confirm Signup Link:

```txt
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

Optional mit Ziel:

```txt
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

Wichtig: Der Link muss auf `hilfinio.de` zeigen, nicht auf eine Supabase-Domain.

## Implementierter App-Support

Die Route `app/auth/callback/route.ts` unterstuetzt:

- neue Supabase Template Links mit `token_hash` und `type`
- bestehende Supabase `code`-Links via `exchangeCodeForSession`
- interne `next`-Redirects, gegen offene Redirects abgesichert
- freundliche Fehlercodes fuer fehlende, ungueltige oder abgelaufene Links

Die Login-Seite zeigt diese Fehler nutzerfreundlich an.

## QA Checklist

Local:

- Neue Registrierung mit Test-Mail ausloesen
- Mail-Link zeigt auf `/auth/callback?token_hash=...&type=email`
- Link bestaetigt die Mail und leitet nach `/dashboard`
- Abgelaufener Link zeigt eine verstaendliche Meldung auf `/login`

Production:

- SPF, DKIM und DMARC beim Anbieter bestanden
- Mail landet nicht im Spam
- From Name ist `Hilfinio`
- From Email ist `no-reply@hilfinio.de`
- Link zeigt auf `https://hilfinio.de/auth/callback...`
- Supabase Auth Logs zeigen erfolgreiche Verifizierung
- Mailanbieter-Logs zeigen keine Bounces oder Complaints

## Operations

Taeglich in der Pilotphase pruefen:

- Signup Conversion: Signup gestartet -> Mail bestaetigt
- Bounce Rate
- Complaint Rate
- Zustellrate
- haeufige Auth-Fehler in Supabase Logs

Bei Beschwerden sofort pruefen:

- DNS nicht verifiziert
- falsche Site URL
- Redirect URL fehlt
- Template nutzt noch Supabase Default-Link
- Link wurde mehrfach oder nach Ablaufzeit geoeffnet
