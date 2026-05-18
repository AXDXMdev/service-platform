# Trust Metrics Aggregation

Hilfinio zeigt auf Service- und Provider-Detailseiten nur Trust- und Conversion-Metriken, die serverseitig aus vorhandenen Plattformdaten berechnet wurden. Der Worker erzeugt keine Dummy-Zahlen und setzt sensitive Vertrauenswerte nicht im Client zusammen.

## Cron Endpoint

- Endpoint: `POST /api/cron/trust-metrics-aggregation`
- Auth: `Authorization: Bearer <CRON_SECRET>`
- Runtime: Next.js Route Handler
- Schreibzugriff: ausschliesslich Supabase Service Role Client
- Response bei Erfolg:

```json
{
  "ok": true,
  "processedProviders": 0,
  "processedServices": 0,
  "skipped": 0,
  "warnings": []
}
```

Die Response enthaelt keine personenbezogenen Detaildaten, keine Service-Role-Secrets und keine Rohdaten aus Requests, Chats oder Reviews.

## Berechnete Metriken

Provider-Level:

- durchschnittliche Antwortzeit aus Request-Erstellung bis zur ersten Provider-Chat-Nachricht
- Antwortquote aus beantworteten Requests im Verhaeltnis zu allen Provider-Requests
- letzte Aktivitaet aus Request-Updates und Request-Erstellung
- abgeschlossene Jobs aus Requests mit Status `completed`
- Wiederbuchungsrate aus wiederkehrenden Kunden mit mehr als einem abgeschlossenen Auftrag
- Verifizierungsstatus aus `provider_verification_requests`
- defensiver Trust Score nur bei ausreichender Datenbasis

Service-Level:

- Requests gesamt
- beantwortete Requests
- abgeschlossene Requests
- Anfragen der letzten 7 Tage
- letzte Anfrage
- Favoritenanzahl
- Review-Durchschnitt
- Review-Anzahl

Review-Level:

- Reviews werden fuer Trust-Metriken nur gezaehlt, wenn `proof_validated` nicht `false` ist und der zugehoerige Request den Status `completed` hat.
- Unterbewertungen aus `service_review_breakdowns` sind vorbereitet und koennen angezeigt werden, sobald echte Review-Detaildaten vorhanden sind.

## Datenquellen

- `public.services`
- `public.requests`
- `public.chat_messages`
- `public.reviews`
- `public.provider_verification_requests`
- `public.abuse_reports`
- `public.favorites`
- Aggregationstabellen:
  - `public.provider_trust_profiles`
  - `public.service_engagement_metrics`
  - `public.service_review_breakdowns`

Falls optionale Tabellen oder Spalten fehlen, laeuft der Worker weiter und gibt eine Warnung aus. Fehlende Daten werden nicht durch Fantasiewerte ersetzt.

## Wann "Noch Keine Daten" Angezeigt Werden Soll

Frontend-Komponenten sollen neutrale Fallbacks anzeigen, wenn:

- `trust_score_available = false`
- `trust_score is null`
- `response_rate_percent is null`
- `response_time_minutes is null`
- `review_count = 0`
- keine abgeschlossenen Requests vorhanden sind

Geeignete Texte sind zum Beispiel "Noch nicht genug Daten", "Neu auf Hilfinio" oder "Antwortdaten werden gesammelt". Nicht geeignet sind erfundene Werte wie "Antwortet in 10 Minuten", wenn keine Chatdaten vorliegen.

## Fake-Zahlen-Vermeidung

- Keine zufaelligen View-, Nachfrage- oder Beliebtheitswerte.
- Keine Client-seitige Berechnung sensibler Trust Scores.
- Reviews zaehlen nur mit validierbarem abgeschlossenen Auftrag.
- Antwortquoten bleiben `null`, wenn Chatdaten nicht verfuegbar sind.
- Trust Score bleibt nicht verfuegbar, wenn zu wenig echte Plattformhistorie vorhanden ist.
- Offene Abuse-Flags reduzieren den Score, statt ignoriert zu werden.

## Vercel Cron

`vercel.json` kann den Worker regelmaessig ausloesen:

```json
{
  "path": "/api/cron/trust-metrics-aggregation",
  "schedule": "*/30 * * * *"
}
```

Empfehlung fuer Production: alle 30 Minuten. Bei starkem Wachstum kann der Worker spaeter in Batches oder in eine Queue verschoben werden.

## Env Vars

Pflicht:

- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional fuer begleitende Plattform-Observability:

- `SENTRY_DSN`
- `OBSERVABILITY_INGEST_URL`
- `OBSERVABILITY_INGEST_TOKEN`

`SUPABASE_SERVICE_ROLE_KEY` darf nie im Client oder als `NEXT_PUBLIC_*` Variable auftauchen.

## RLS Und Schreibrechte

Die Migration aktiviert RLS fuer:

- `provider_trust_profiles`
- `service_engagement_metrics`
- `service_review_breakdowns`

Policies erlauben nur `select` fuer freigegebene aggregierte Daten. Normale Nutzer erhalten keine `insert`, `update` oder `delete` Policies. Schreiboperationen laufen ueber den Service Role Client im Cron Worker.

## Production Checks Vor Aktivierung

- Migration auf Supabase ausrollen.
- `CRON_SECRET` in Vercel Production/Preview setzen.
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig setzen.
- Cron in Vercel aktivieren.
- Sentry/Logging auf Cron-Fehler beobachten.
- Einmal manuell mit korrektem Bearer Secret ausfuehren.
- Tabellen nach dem ersten Lauf pruefen:
  - `provider_trust_profiles`
  - `service_engagement_metrics`
- Detailseiten auf neutrale Fallback-Texte pruefen, wenn Metriken fehlen.

## Skalierung

Der aktuelle Worker ist schema-tolerant und sicher fuer den Softlaunch. Bei hoeherem Datenvolumen sollte die Aggregation inkrementell werden:

- nur geaenderte Provider/Services seit dem letzten Lauf
- Batch-Verarbeitung mit Cursor
- Queue fuer Review-, Chat- und Request-Events
- Materialized Views oder SQL Functions fuer schwere Aggregationen
- separate Monitoring-Metriken fuer Laufzeit, Fehlerquote und verarbeitete Entitaeten
