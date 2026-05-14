# Hilfinio Live-Readiness Checklist

## 1) Datenbank

1. Führe die Migration aus:
   - `supabase/migrations/20260423_live_readiness.sql`
2. Prüfe, ob neue Spalten vorhanden sind:
   - `services.is_verified`
   - `services.is_volunteer`
   - `services.supports_sign_language`
   - `services.text_chat_only`
   - `services.barrier_free_support`
   - `requests.status`, `requests.deleted_at`, `requests.updated_at`
3. Prüfe neue Tabellen:
   - `profiles`
   - `request_events`
   - `reviews`
4. Teste RLS mit zwei Accounts (Kunde/Anbieter).

## 2) Rollen & Admin

1. Lege mindestens einen Admin in `profiles` an (`role = 'admin'`).
2. Nutze die Admin-Konsole zum Verifizieren von Services.
3. Stelle sicher, dass normale User Admin-Seiten nicht erreichen.

## 3) Anfrage-Workflow

1. Kunde erstellt Anfrage.
2. Anbieter kann:
   - annehmen
   - ablehnen
   - abschließen
   - löschen (Soft-Delete)
3. Kunde kann:
   - zurückziehen (pending)
   - löschen (Soft-Delete)
4. Prüfe, ob Events in `request_events` geschrieben werden.

## 4) Bewertungen & Vertrauen

1. Kunde bewertet nach `accepted` oder `completed`.
2. Durchschnittsbewertung erscheint auf Service-Detailseite.
3. Verifizierungs-Badge erscheint bei `is_verified = true`.

## 5) Accessibility

1. Tastaturbedienung ohne Maus prüfen.
2. Screenreader-Test (VoiceOver/NVDA) durchführen.
3. Hoher Kontrast + große Schrift + reduzierte Bewegung testen.
4. Einfache Sprache in realen Nutzertests validieren.

## 6) Go-Live Gate

Vor öffentlichem Launch müssen diese KPIs im Pilot stabil sein:

- Erste Antwortzeit < 30 Minuten (Median)
- Anfrage -> Annahme > 35%
- Kein kritischer Sicherheitsvorfall
- Keine P1/P2 Bugs offen
