# Hilfinio Go-Live Checklist (Deutschland)

Stand: 2026-04-25

## 1) Product / Platform

- [x] Pilot cities aktiv (Berlin, Hamburg, München, Stuttgart)
- [x] Anbieter-Verifizierung integriert
- [x] Bewertungsmoderation mit Nachweis-Feldern integriert
- [x] Upload von Arbeitsbeispielen (Foto/Video) für Anbieter integriert
- [ ] Inhalte vollständig sprachlich geprüft (DE/EN/TR)
- [ ] Support-Prozess für Missbrauchsmeldungen dokumentiert

## 2) Datenschutz / Recht

- [x] Impressum-Seite vorhanden
- [x] Datenschutz-Seite vorhanden
- [x] AGB-Seite vorhanden
- [ ] Rechtstexte final juristisch prüfen lassen (anwaltlich)
- [ ] Consent-Management für nicht-essenzielle Cookies/Ads live schalten
- [ ] AV-Verträge (Auftragsverarbeitung) mit allen Drittanbietern abschließen
- [ ] Verzeichnis von Verarbeitungstätigkeiten (RoPA) dokumentieren
- [ ] Prozess für Betroffenenrechte (Auskunft/Löschung etc.) operativ festlegen
- [ ] Lösch- und Aufbewahrungskonzept umsetzen und testen

## 3) Security

- [x] Admin-Session abgesichert (kein schwacher Fallback-Token)
- [ ] Rate-Limits für Login, Anfrage, Review und Upload-Endpunkte
- [ ] Security Headers (CSP, X-Frame-Options, Referrer-Policy) finalisieren
- [ ] Malware-/Inhaltsprüfung für Uploads (Bilder/Videos) einführen
- [ ] Incident-Runbook (Datenpanne, Abuse, Incident Response) dokumentieren

## 4) Data / Infra

- [x] Supabase-Migrationen für Trust-Flow vorhanden
- [x] Migration für `media_urls` + Storage-Bucket vorhanden
- [ ] Migrationen in Production vollständig ausführen
- [ ] Backups und Restore-Tests dokumentieren
- [ ] Monitoring/Alerting (Errors, 5xx, Auth Failures, DB) aktivieren

## 5) Quality / Operations

- [x] Build und Lint laufen erfolgreich
- [ ] E2E-Smoketests für Kernfluss (Login -> Service -> Anfrage -> Moderation -> Review)
- [ ] Barrierefreiheits-Quickaudit (Tastatur, Kontrast, Fokusreihenfolge, Screenreader)
- [ ] Performance-Budget (LCP/CLS/INP) messen und Grenzwerte definieren
- [ ] Rollout-Plan inkl. Supportfenster und Fallback-Plan definieren

