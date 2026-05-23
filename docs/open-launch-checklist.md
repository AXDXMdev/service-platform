# Hilfinio Open Launch Checklist

Stand: 2026-05-23

Diese Checkliste ist der operative Rahmen für einen seriösen öffentlichen Launch. Sie ersetzt keine juristische Prüfung und keine produktive Monitoring-Disziplin.

## Vor Launch

- [ ] TODO_LEGAL_REVIEW: Impressum, Datenschutz, AGB, Cookie-Texte, Anbieterpflichten, Widerruf/Verbraucherschutz und Plattformrolle final juristisch prüfen lassen.
- [ ] TODO_LEGAL_REVIEW: Auftragsverarbeitung, Supabase/Vercel-DPA, Drittlandtransfer und TOMs dokumentieren.
- [ ] Alle Supabase-Migrationen im Live-Projekt ausführen und RLS für `services`, `requests`, `messages`, `reviews`, `notifications`, `reports` und Storage prüfen.
- [ ] Vercel Production Env Vars vollständig setzen: Supabase, Upstash, Sentry, `CRON_SECRET`, Site URL und Admin-Secrets.
- [ ] Google Search Console für `hilfinio.de` und `www.hilfinio.de` verifizieren.
- [ ] Domains und Redirects prüfen: Apex, `www`, HTTPS, Canonical, Sitemap, robots.txt.
- [ ] Smoke-Test durchführen: Registrierung, Login, Service erstellen, Anfrage senden, Inbox, Meldung, Cookie-Auswahl, Account-Löschung.
- [ ] TODO_SECURITY_HARDENING: CSP ohne `unsafe-inline` mit Nonce/strict-dynamic planen, sobald alle Inline-Skripte sauber migriert sind.
- [ ] TODO_SECURITY_HARDENING: Upload-AV/Sanitizer für Medienpipeline produktiv anbinden.
- [ ] Erste echte Anbieterprofile prüfen: keine Testdaten, keine peinlichen Platzhalter, keine falschen Trust-Zahlen.

## Während Launch

- [ ] Sentry Issues aktiv beobachten: neue Fehler, Auth-Probleme, API-Ausfälle.
- [ ] Vercel Logs prüfen: 4xx/5xx-Spitzen, langsame Funktionen, Cron-Ausfälle.
- [ ] Supabase Dashboard prüfen: Auth-Fehler, RLS-Fehler, Datenbanklast, Storage-Fehler.
- [ ] Abuse-/Report-Eingänge täglich priorisieren.
- [ ] Social-Kommentare und Direktnachrichten beantworten.
- [ ] Neue Anbieter manuell stichprobenartig prüfen.

## Nach Launch

- [ ] Erste 20 echte Nutzerfeedbacks sammeln und in Produkt-/UX-Themen clustern.
- [ ] Top Suchbegriffe aus Search Console und interner Suche auswerten.
- [ ] Anfrage-zu-Antwort-Rate, erste Antwortzeit und abgebrochene Flows prüfen.
- [ ] Rechtstexte nach finaler juristischer Rückmeldung aktualisieren.
- [ ] Backup-/Restore-Prozess mit Supabase dokumentiert testen.

## Tägliche Checks Woche 1

- [ ] Sentry: neue kritische Issues, Regressionen, Browser-/Device-Häufungen.
- [ ] Vercel Analytics/Speed Insights: LCP, CLS, INP, mobile Performance.
- [ ] Supabase: Auth, Datenbankfehler, Storage, RLS-Denials.
- [ ] Trust & Safety: neue Reports, Spam-Verdacht, auffällige Accounts.
- [ ] Marketplace: neue Services, offene Anfragen, unbeantwortete Nachrichten.

## Kritische Metriken

- Performance: `/` >= 95 Lighthouse mobile, `/services` >= 90 Lighthouse mobile.
- Zuverlässigkeit: keine reproduzierbaren 500er in Kernflows.
- Trust: keine ungeprüften Fake-Metriken, keine sichtbaren Testdaten.
- Conversion: Service-Suche, Anfrage-CTA, Registrierung und Login müssen mobil funktionieren.
- Safety: Reports müssen gespeichert oder mit Support-Hinweis sauber abgefangen werden.

## Notfallmaßnahmen

- Schwerer Bug: neues Deployment stoppen, letzte stabile Vercel-Production zurückrollen.
- Datenproblem: Schreibendpunkte vorübergehend über Feature Flag oder Wartungstext begrenzen.
- Abuse-Welle: Rate Limits verschärfen, auffällige IPs/Accounts blockieren, Reports priorisieren.
- Rechtliches Risiko: betroffene Inhalte entfernen oder temporär ausblenden, Betreiber und juristische Prüfung einbeziehen.
- Supabase-Ausfall: Status prüfen, Nutzer mit ehrlicher Fehlermeldung informieren, keine Datenverluste durch Retry-Schleifen riskieren.

