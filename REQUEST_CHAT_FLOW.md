# Request And Chat Flow

Hilfinio verwendet einen echten Anfrage- und Chat-Unterbau, damit Antwortzeiten, Antwortquoten, abgeschlossene Jobs und Review-Berechtigungen aus realen Plattforminteraktionen berechnet werden koennen.

## Datenmodell

`public.requests`

- `id`
- `service_id`
- `sender_id` als bestehender Customer-Identifier
- `customer_id` als expliziter Customer-Identifier fuer neue Flows
- `provider_id` als denormalisierter Provider-Identifier
- `status`: `pending`, `accepted`, `declined`, `rejected`, `completed`, `cancelled`, `deleted`
- `first_message`
- `preferred_date`
- `request_location`
- `contact_preference`
- `created_at`
- `updated_at`
- `first_provider_response_at`
- `completed_at`
- `cancelled_at`
- `declined_at`
- `decline_reason`
- `proof_validated`

`public.chat_messages`

- `id`
- `request_id`
- `sender_id`
- `receiver_id`
- `message` fuer Rueckwaertskompatibilitaet
- `body` als neuer kanonischer Nachrichtentext
- `created_at`
- `read_at`
- `system_event_type`

`public.reviews`

- Reviews bleiben an `request_id` und `service_id` gebunden.
- Eine Review wird nur nach `requests.status = 'completed'` erlaubt.
- `proof_validated` bleibt fuer Moderation und Trust-Metriken erhalten.

## APIs

`POST /api/requests`

Erstellt eine Anfrage fuer einen fremden Service und speichert die erste Nachricht als Chat-Nachricht.

Input:

- `serviceId`
- `message`
- `customerBudgetEur`
- `preferredDate`
- `location`
- `contactPreference`

Serverregeln:

- User muss eingeloggt sein.
- Service muss existieren.
- Eigene Services koennen nicht angefragt werden.
- Nachricht muss mindestens 10 Zeichen haben.
- Rate Limit schuetzt gegen Anfrage-Spam.
- `provider_id` wird serverseitig aus `services.user_id` abgeleitet.

`POST /api/requests/[id]/messages`

Schreibt eine Nachricht in den Request-Chat. Nur Customer oder Provider duerfen schreiben. Die erste Provider-Nachricht setzt `requests.first_provider_response_at`.

`PATCH /api/requests/[id]/status`

Aendert den Status und schreibt ein System-Event.

## Statusmaschine

Erlaubte Uebergaenge:

- Provider: `pending -> accepted`
- Provider: `pending -> declined`
- Provider: `accepted -> completed`
- Customer: `pending -> cancelled`
- Legacy-kompatibel: `rejected` bleibt als alter Ablehnungsstatus lesbar

Nicht erlaubt:

- fremde Nutzer koennen keine Requests lesen, schreiben oder aendern
- completed ohne Teilnehmerrolle
- Review vor completed

## Response-Time-Berechnung

Die echte erste Antwortzeit kommt aus:

- `requests.created_at`
- `requests.first_provider_response_at`

Falls `first_provider_response_at` aus alten Daten fehlt, kann die Aggregation weiterhin die erste Provider-Chat-Nachricht aus `chat_messages.created_at` als Fallback nutzen.

Die Antwortquote basiert auf:

- Requests eines Providers
- Requests mit mindestens einer Provider-Antwort

Wenn Chatdaten fehlen, wird keine Antwortquote erfunden.

## RLS-Regeln

`requests`

- Customer sieht eigene Requests via `sender_id` oder `customer_id`.
- Provider sieht Requests via `provider_id` oder Service Owner.
- Admin/Moderator darf lesen/aendern.
- Insert nur fuer eingeloggten Sender.

`chat_messages`

- Lesen und Schreiben nur fuer Teilnehmer der Anfrage.
- Sender muss `auth.uid()` sein.
- Admin/Moderator darf lesen.

`reviews`

- Public Read bleibt fuer freigegebene Reviews.
- Insert nur durch Customer des completed Requests.

## Review-Berechtigung

Eine Review ist erlaubt, wenn:

- User Customer der Anfrage ist
- `request_id` und `service_id` zusammenpassen
- Request `completed` ist
- noch keine Review desselben Reviewers fuer diese Anfrage existiert

Trust-Metriken zaehlen Reviews nur, wenn der zugehoerige Request completed ist und `proof_validated` nicht `false` ist.

## UI-Integration

Die Service-Detailseite sendet jetzt:

- konkrete Anfrage-Nachricht
- optional Budget
- optional Wunschzeitraum
- optional Einsatzort
- Kontaktpraeferenz

Nach erfolgreichem Versand wird der Nutzer zum Chat weitergeleitet. Mobile Nutzer bleiben ueber Sticky CTA schnell im Anfragebereich.

## Production Checks

- Migration `20260518_request_chat_response_tracking.sql` in Supabase ausrollen.
- RLS-Policies pruefen:
  - keine fremden Requests sichtbar
  - keine fremden Chat-Nachrichten sichtbar
  - Reviews nur bei completed Requests insertbar
- `npm run lint`
- `npm run type-check`
- `npm test`
- `npm run build`
- Manueller Smoke Test:
  - Kunde fragt fremden Service an
  - Provider antwortet
  - `first_provider_response_at` wird gesetzt
  - Provider markiert accepted/completed
  - Kunde kann danach genau eine Review schreiben

## Offene Notification-TODOs

- E-Mail oder Push bei neuer Anfrage
- E-Mail oder Push bei neuer Chat-Nachricht
- Reminder fuer unbeantwortete Anfragen
- Provider SLA-Warnung bei langer Antwortzeit
- Admin-Monitoring fuer Spam- oder Abuse-Muster
