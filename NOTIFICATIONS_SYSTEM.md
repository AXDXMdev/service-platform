# Notifications System

Hilfinio nutzt In-App-Notifications, damit Kunden und Anbieter wichtige Anfrage-, Chat- und Statusereignisse nicht verpassen. E-Mail-Versand ist provider-agnostisch vorbereitet, aber ohne konfigurierten Mailprovider bewusst deaktiviert.

## Eventtypen

- `new_request`: Provider erhaelt eine neue Service-Anfrage.
- `new_message`: Empfaenger erhaelt eine neue Chat-Nachricht.
- `request_accepted`: Kunde wird informiert, wenn der Provider annimmt.
- `request_declined`: Kunde wird informiert, wenn der Provider ablehnt.
- `request_completed`: Kunde wird informiert, wenn der Auftrag abgeschlossen wurde.
- `review_available`: Kunde wird informiert, dass eine Bewertung moeglich ist.

Self-Notifications werden nicht erzeugt.

## Datenmodell

`public.notifications`

- `id`
- `user_id`
- `type`
- `request_id`
- `service_id`
- `actor_id`
- `title`
- `body`
- `read_at`
- `created_at`

`public.notification_preferences`

- `user_id`
- `email_new_requests`
- `email_messages`
- `email_status_updates`
- `in_app_enabled`
- `updated_at`

## RLS

`notifications`

- User lesen nur eigene Notifications.
- User duerfen nur eigene Notifications aktualisieren, z. B. `read_at`.
- Es gibt keine normale `insert` Policy fuer Nutzer.
- Writes entstehen serverseitig ueber den Service-Role-Client.

`notification_preferences`

- User lesen, erstellen und aktualisieren nur eigene Preferences.

## In-App Flow

- API: `GET /api/notifications`
- API: `PATCH /api/notifications/[id]/read`
- API: `PATCH /api/notifications/read-all`
- UI: `NotificationBell` in der Hauptnavigation
- Links fuehren auf `/dashboard/requests/[id]`, falls `request_id` vorhanden ist.
- Mobile nutzt dasselbe Dropdown als breite, touchfreundliche Overlay-Flaeche.

## Event-Erzeugung

Notifications werden erzeugt bei:

- `createRequest`: `new_request` an Provider
- `createChatMessage`: `new_message` an Empfaenger
- `updateRequestStatus`: accepted, declined, completed
- `completed`: zusaetzlich `review_available` an Customer

Die Event-Erzeugung ist non-blocking fuer den Kernflow: Wenn die Notification-Tabelle noch nicht migriert ist oder die Service Role lokal fehlt, scheitert nicht die Anfrage oder Chat-Nachricht.

## E-Mail-Vorbereitung

`services/notificationEmailService.ts` kapselt spaeteren Mailversand.

Aktuell:

- prueft Preferences
- loggt vorbereitete E-Mail-Events
- sendet keine Fake-Mails
- ist provider-agnostisch

Production-Optionen:

- Resend
- Postmark
- Amazon SES

## Production Env TODOs

Pflicht fuer echte serverseitige Notification-Writes:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

Spaeter fuer E-Mail:

- `RESEND_API_KEY` oder `POSTMARK_SERVER_TOKEN`
- `NOTIFICATION_EMAIL_FROM`
- verifizierte Sending Domain
- Bounce/Complaint Handling
- Unsubscribe/Preference UI

## Production Checks

- Migration `20260518_notifications_system.sql` ausrollen.
- Service Role nur serverseitig setzen.
- Notification Bell als eingeloggter Nutzer pruefen.
- Neue Anfrage erzeugt Provider-Notification.
- Neue Nachricht erzeugt Empfaenger-Notification.
- Statuswechsel erzeugt Customer-Notification.
- Completed erzeugt Review-Available-Notification.
- Fremde Notifications sind weder sichtbar noch als gelesen markierbar.
