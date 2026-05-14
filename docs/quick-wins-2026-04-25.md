# Hilfinio Quick Wins (2026-04-25)

## Umgesetzt

1. Performance
- Session-Cache für Service-Liste und Service-Detail (`lib/clientCache.ts`)
- Entfernt: alter `ServiceBot`-Prototyp wurde beim Cleanup gestrichen, weil er nicht eingebunden war.
- API-Calls reduziert (`my-requests`: nur relevante Services statt `select("*")` für alle)

2. Conversion / Trust
- Budget-Feld im Anfrageflow (`customer_budget_eur`)
- Anbieter-Angebotsfeld im Dashboard (`provider_offer_eur`)
- Rebooking-Button in `my-requests`
- Status-Tracking-Balken in `my-requests`

3. Marketplace Features
- Favoritenmodell + Favoriten-Seite (`/favorites`)
- Favoriten-Toggle im Service-Detail
- Basis-Chat pro Anfrage (`/chat/[requestId]`)
- Verfügbarkeitstage + Verfügbarkeitsnotiz für Anbieter
- Erste-Hilfe-Kurse als Kategorie

4. SEO
- Verbesserte globale Metadata (Title Template, OG, Twitter)
- `app/sitemap.ts`
- `app/robots.ts`
- JSON-LD (`WebSite` + `SearchAction`) auf der Startseite

5. Security
- Input-Validation Utility (`lib/validation.ts`)
- Honeypot-Feld für Login/Register
- Origin-Check + Rate-Limit in Admin-Session-Route
- Security Headers in `next.config.ts`

6. Mobile UX
- Thumb-friendly mobile Linkbar in der oberen Navigation

7. Growth / Monetization / Scale Foundations
- KPI- und Earnings-Übersicht im Anbieter-Dashboard
- Referral-Link im Dashboard
- Feature-Flags Basis (`lib/featureFlags.ts`)
- Premium/Boost Datenfelder vorbereitet

## Offene nächste Schritte (Sprint-Empfehlung)

1. Stripe Checkout + Webhooks (echte Plattformgebühr, payout-ready)
2. Serverseitige API-Routen für kritische Writes (statt rein clientseitigem Supabase-Write)
3. Spam-/Abuse-Härtung (Captcha + Upload-Moderation + IP-Limits für weitere Endpunkte)
4. Vollständiger Buchungskalender (slot-basiert mit Datum/Uhrzeit)
5. Chat Realtime (Supabase channel subscribe) + Read Receipts
