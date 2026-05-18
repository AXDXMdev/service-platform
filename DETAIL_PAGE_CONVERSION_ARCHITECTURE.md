# Hilfinio Detail Page Conversion Architecture

Stand: 2026-05-18

## Zielbild

Service- und Provider-Detailseiten sollen wie ein moderner lokaler Marketplace funktionieren: schnell, mobil stark, vertrauensbildend und ohne erfundene Kennzahlen. Die UI zeigt echte Werte, sobald sie vorhanden sind. Fehlende Daten werden als transparente Fallback-States dargestellt.

## Neue Komponentenstruktur

- `components/service-detail/ServiceHeroGallery.tsx`: responsive Hero-Gallery mit Bild, Video und glaubwuerdigem Placeholder.
- `components/service-detail/ProviderAvatar.tsx`: Profilbild mit Initialen-Fallback.
- `components/service-detail/ConversionSignalGrid.tsx`: Antwortzeit, Antwortquote, abgeschlossene Jobs, Wiederbuchung, Aktivitaet und Bewertung.
- `components/service-detail/TrustBadgeGrid.tsx`: Verifizierungsstatus fuer Profil, E-Mail, Telefon, Ausweis, Gewerbe und Top-Rated.
- `components/service-detail/ReviewSnapshot.tsx`: Review-Trust-Layer mit Unterkategorien und ehrlichen Empty States.
- `components/service-detail/SafetyPanel.tsx`: Plattformschutz, Abuse-Meldung und sichere Anfragehinweise.
- `components/service-detail/MobileStickyActions.tsx`: thumb-friendly mobile CTA fuer Anfrage, Kontakt und Merken.

## Conversion-Prinzipien

- Erste Bildschirmhoehe beantwortet: Was ist das? Wer bietet es an? Wo? Was kostet es? Kann ich vertrauen?
- Desktop nutzt eine sticky Conversion Card, Mobile nutzt eine sticky Bottom Action Bar.
- Trust-Signale sind nahe am CTA, nicht versteckt am Seitenende.
- Zahlen werden nicht gefaked. Wenn Metriken fehlen, steht dort "Noch keine Daten" oder "Wird nach ersten Antworten berechnet".
- Lokale Naehe wird ueber Standort, Einsatzgebiet und Distanzfreigabe sichtbar.

## Trust-&-Safety-System

Verifizierungsstatus:

- `email_verified`
- `phone_verified`
- `identity_verified`
- `business_verified`
- `is_verified`
- `is_top_rated`

Operative Schutzmechanik:

- Nur abgeschlossene Auftraege duerfen Reviews erzeugen.
- Review-Kategorien werden getrennt gespeichert.
- Trust-Metriken werden serverseitig/workerbasiert aggregiert, nicht im Client berechnet.
- Abuse-Meldung bleibt prominent auf Detailseiten erreichbar.

## Datenmodell-Erweiterungen

Siehe Migration:

- `supabase/migrations/20260518_detail_page_trust_metrics.sql`

Tabellen:

- `provider_trust_profiles`: veroeffentlichbare Trust- und Response-Metriken pro Anbieter.
- `service_engagement_metrics`: aggregierte Service-Metriken fuer Conversion-Signale.
- `service_review_breakdowns`: strukturierte Review-Unterbewertungen.

## RLS-Ideen

- Public darf nur aggregierte Trust-/Engagementdaten lesen.
- Schreibzugriff nur ueber Service Role, Admin-Workflows oder sichere Worker.
- Provider duerfen spaeter eigene oeffentliche Trust-Daten lesen, aber nicht selbst Verifizierungen setzen.
- Review-Breakdowns duerfen nur entstehen, wenn der Request abgeschlossen ist.

## SEO

Bestehende serverseitige Metadata/JSON-LD bleibt erhalten. Detailseiten zeigen im UI nun dieselben Entitaeten, die strukturiert beschrieben werden: Service, Anbieter, Standort, Preis, Reviews, Trust.

## Performance

- Hero nutzt `next/image` mit `priority` nur fuer das erste visuelle Asset.
- Weitere Gallery-Bilder lazy-loaden.
- Trust-/Review-Komponenten sind stateless und verursachen keine eigenen Client-Fetches.
- Mobile Sticky Actions vermeiden Layout Shift durch feste Bottom Area und extra Page Padding.

## Edge Cases

- Kein Bild: Kategorie-Placeholder statt kaputtem Frame.
- Kein Profilbild: Initialen-Avatar.
- Keine Reviews: ehrlicher Review-Empty-State.
- Keine Verifizierung: ausstehender Status statt gruener Fake-Badge.
- Keine Response-Metriken: "Noch keine Daten".
- Kein Standort: "Standort nicht angegeben".

## Naechste Schritte

1. Migration ausrollen.
2. Worker bauen, der `provider_trust_profiles` und `service_engagement_metrics` aus Requests/Chats/Reviews aggregiert.
3. Review-Erfassung um Unterkategorien erweitern.
4. Admin-Moderation fuer Trust-Badges und Top-Rated-Kriterien bauen.
5. Playwright Mobile Smoke fuer Service-Detail und Provider-Profil ergaenzen.
