# Inbox And Request Management

Hilfinio hat eine zentrale Inbox fuer Kunden und Anbieter. Ziel ist ein klarer Marketplace-Workflow: Anfrage kommt rein, Teilnehmer chatten, Anbieter nimmt an oder lehnt ab, Auftrag wird abgeschlossen, Kunde kann danach bewerten.

## Seitenstruktur

- `/dashboard/inbox`
  - zentrale Inbox fuer Kunden- und Anbieterrollen
  - Tabs: Alle, Offen, Angenommen, Abgeschlossen, Abgelehnt
  - Suche nach Service oder Nachricht
  - Sortierung nach neueste Aktivitaet, ungelesen zuerst, dringend zuerst
  - Unread Badges aus `chat_messages.read_at`

- `/dashboard/requests`
  - Alias auf dieselbe Inbox-Experience

- `/dashboard/requests/[id]`
  - Request-Detailseite
  - Service-Info, Status, Wunschzeitraum, Ort, Budget, Kontaktpraeferenz
  - Chatverlauf mit System-Events
  - rollenbasierte Aktionen
  - Review CTA nach `completed`

## Rollenlogik

Customer:

- sieht eigene gesendete Requests via `sender_id` oder `customer_id`
- kann bei `pending` abbrechen
- kann nach `completed` genau eine Review erstellen
- kann Chat-Nachrichten senden, solange Request nicht read-only ist

Provider:

- sieht Requests zu eigenen Services via `services.user_id`
- sieht Requests via `provider_id`
- kann `pending -> accepted`
- kann `pending -> declined`
- kann `accepted -> completed`
- erste Provider-Nachricht setzt `first_provider_response_at`

Fremde Nutzer:

- erhalten in API und UI keinen Zugriff
- Detail-Loads geben bewusst 404 statt Datenleck

## Statuslogik

- `pending`: Provider kann annehmen oder ablehnen, Kunde kann abbrechen
- `accepted`: Chat aktiv, Provider kann Abschluss markieren
- `completed`: Chat lesbar, Customer bekommt Review CTA
- `cancelled`, `declined`, `rejected`, `deleted`: read-only oder archiviert

`rejected` bleibt als Legacy-Status lesbar. Neue Ablehnungen nutzen `declined`.

## Mobile UX

- Inbox Cards sind kompakt, gut scanbar und touchfreundlich.
- Request-Detail ist zweigeteilt:
  - oben/links kompakte Status- und Metainfos
  - Chat als Messenger-artiger Verlauf
- Message Input ist sticky am unteren Rand.
- Actions sind grosse Buttons und rollenbasiert sichtbar.
- Read-only Status zeigt einen klaren Hinweis statt deaktivierter Mystery Controls.

## Read Tracking

- `chat_messages.read_at` wird gesetzt, wenn ein Teilnehmer die Detailseite oeffnet.
- Es werden nur Nachrichten aktualisiert, bei denen `receiver_id = auth.uid()`.
- Eigene Nachrichten werden nicht als gelesen markiert, weil sie fuer den Sender nicht ungelesen sind.
- Inbox-Unread-Badges basieren auf `receiver_id` und `read_at is null`.

## Security Und RLS

Serverseitige Guards:

- Inbox-Daten kommen aus `/api/dashboard/inbox`.
- Request-Details kommen aus `/api/dashboard/requests/[id]`.
- Read Updates laufen ueber `/api/dashboard/requests/[id]/read`.
- Status, Message und Review Actions nutzen bestehende serverseitige APIs.

Supabase RLS:

- Requests sind nur fuer Customer, Provider und Admin/Moderator sichtbar.
- Chat Messages sind nur fuer Teilnehmer sichtbar.
- Reviews koennen nur vom Customer eines completed Requests erstellt werden.

Client UI ist nur Komfort. Keine Rollenentscheidung im Client ersetzt serverseitige Checks.

## Production TODOs

- Push/E-Mail bei neuer Anfrage.
- Push/E-Mail bei neuer Nachricht.
- SLA Reminder fuer unbeantwortete Provider-Anfragen.
- Provider Inbox Badges in Navigation.
- Admin-Queue fuer auffaellige Message-Spam-Muster.
- Vollstaendige Realtime-Updates via Supabase Realtime oder Polling.
- Optional: `read_receipts` Tabelle, falls spaeter mehrere Geraete/Teilnehmerrollen granularer werden.
