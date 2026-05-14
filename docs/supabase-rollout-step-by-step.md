# Supabase Rollout Schritt für Schritt

Stand: 23. April 2026

## 1) Vorbereitung

1. Öffne Supabase Dashboard -> SQL Editor.
2. Erstelle ein neues Query.
3. Lade den Inhalt aus:
   - `/Users/alaadinadem/service-platform/supabase/migrations/20260423_live_readiness.sql`
4. Erstelle danach ein zweites Query und lade:
   - `/Users/alaadinadem/service-platform/supabase/migrations/20260423_trust_and_ads_extensions.sql`

## 2) Migration ausführen

1. Führe das SQL komplett aus.
2. Prüfe danach diese Tabellen:
   - `profiles`
   - `request_events`
   - `reviews`
   - `waitlist_entries`
   - `provider_verification_requests`

Validierung:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'request_events', 'reviews', 'waitlist_entries', 'provider_verification_requests')
order by table_name;
```

## 3) Rollen setzen (Admin)

Für deinen Nutzer:

```sql
insert into public.profiles (user_id, role, full_name, verification_level)
values ('DEINE-USER-ID-HIER', 'admin', 'Hilfinio Admin', 'trusted')
on conflict (user_id) do update
set role = excluded.role,
    full_name = excluded.full_name,
    verification_level = excluded.verification_level;
```

User-ID findest du in `auth.users`.

## 4) RLS kurz testen

1. Mit normalem Kundenkonto anmelden:
   - Services lesen: ja
   - Fremde Request-Events lesen: nein
2. Mit Adminkonto anmelden:
   - Admin-Audit-Log sichtbar
   - Verifizierungs-Panel nutzbar

## 5) Workflow testen

1. Kunde erstellt Anfrage.
2. Anbieter nimmt an, lehnt ab, schließt ab.
3. Prüfen:

```sql
select id, request_id, event_type, from_status, to_status, actor_id, created_at
from public.request_events
order by created_at desc
limit 20;
```

4. Kunde kann bewerten:

```sql
select id, request_id, service_id, reviewer_id, rating, created_at
from public.reviews
order by created_at desc
limit 20;
```

## 6) Pilot-Stadt & Warteliste testen

1. Services außerhalb Pilot-Städte in UI prüfen (werden im Listing ausgeblendet).
2. Anbieter mit Nicht-Pilot-Stadt erstellen -> landet in Warteliste.
3. Warteliste prüfen:

```sql
select id, full_name, email, city, role, created_at
from public.waitlist_entries
order by created_at desc
limit 30;
```

4. Provider-Verifizierung prüfen:

```sql
select id, user_id, company_name, city, status, created_at
from public.provider_verification_requests
order by created_at desc
limit 30;
```

## 7) Rollback-Hinweis

Wenn du zurücksetzen musst, erstelle ein separates Rollback-Script.
Nicht im Produktionsprojekt direkt Tabellen droppen.
