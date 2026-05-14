# WEBSITE_LANGUAGE_PERFORMANCE_AUDIT

## Gepruefte Sprachen
- Deutsch (`de`)
- Englisch (`en`)
- Tuerkisch (`tr`)

## Aktueller Zustand
Die Website ist funktional, baut erfolgreich und hat eine solide Basis fuer einen nahen Launch. Die globale Sprachschicht ist vorhanden, aber noch nicht durchgaengig auf allen Seiten verwendet. Besonders globale UI-Elemente und Auth-Flows waren teilweise noch deutsch-only oder sprachlich uneinheitlich.

## Korrigierte Rechtschreib- und Sprachprobleme
- Deutsche Begriffe in der Hauptnavigation und Hero-CTA vereinheitlicht:
  - `Dienstleister finden` -> `Anbieter finden`
  - `Login` / `Logout` -> `Anmelden` / `Abmelden`
- Englische Auth-Texte praezisiert:
  - `Login` / `Logout` -> `Log in` / `Log out`
- Tuerkische UI-Texte verbessert:
  - `Service botu ac` / `Service botu kapat` -> `Hizmet botunu ac` / `Hizmet botunu kapat`
  - `uygun hizmet` -> `uygun hizmetler`
  - `Giris` / `Cikis` -> `Giris yap` / `Cikis yap`
- Global sichtbare Komponenten lokalisiert:
  - Brand-Tagline in der Navigation
  - Theme-Toggle ARIA-Labels
  - Language-Switcher ARIA-Label
  - Footer-Linktexte und Fallback-Footertext
  - Service-Kartenlabels wie Standort, Preis, Bewertung, Verifizierung, Buttons
  - 404-Seite
  - Login- und Registrierungs-UI inklusive Formular-Placeholders und Standardaktionen
- Rohe Auth- und Wartelistenfehler gegen nutzerfreundlichere Meldungen abgesichert:
  - Login
  - Registrierung
  - Passwort-Reset
  - Passwort-Update
  - Warteliste

## Offene Sprach-TODOs
- Mehrere Inhaltsseiten und Dashboard-/App-Seiten sind weiterhin primaer deutsch und noch nicht vollstaendig ueber `app/i18n.ts` lokalisiert.
- Supabase-/Backend-Fehlermeldungen werden derzeit roh angezeigt und sind nicht sprachspezifisch normalisiert.
- Meta-Titles und Meta-Descriptions sind derzeit nur deutsch und nicht locale-sensitiv.
- Rechtstexte sind inhaltlich noch Platzhalter bzw. Vorlagen und nicht final juristisch abgestimmt.

## Performance-Status
Grundlage ist gut, aber noch nicht voll optimiert fuer einen echten Launch mit mehr Traffic.

## Gefundene Performance-Probleme
- `public/hilfino-logo.png` ist mit ca. `852K` fuer OG/Brand-Nutzung relativ gross.
- Das neue Open-Graph-Bild `public/hilfinio-og.png` ist mit ca. `59K` deutlich schlanker und wird jetzt fuer Social Preview genutzt.
- Mehrere Bilder werden mit `next/image` und `unoptimized` gerendert:
  - `components/ServiceListingCard.tsx`
  - `app/provider/[id]/page.tsx`
  - `app/service/[id]/page.tsx`
- Viele zentrale Seiten laufen als Client Components. Ein Teil davon ist gerechtfertigt durch Theme, Sprache, Accessibility und interaktive Filter, aber die Shell ist weiterhin relativ client-lastig.
- Locale-spezifische SEO-Metadaten fehlen.

## Behobene Performance-Probleme
- Keine riskanten Architektur-Umbauten vorgenommen.
- Root-Metadaten sprachlich gestrafft und fuer Suchergebnis-/Social-Preview-Wording verbessert.
- Eigenes leichtes Open-Graph-Bild bereitgestellt und in den globalen Metadaten verdrahtet.
- Unnoetige Lint-Warnung in `mobile/App.tsx` entfernt, damit Root-Checks wieder sauber laufen.

## Technische Checks und Ergebnisse
- `npm run lint`: erfolgreich
- `npm run typecheck`: erfolgreich
- `npm run build`: erfolgreich
- `npm run test`: erfolgreich
  - 3 Smoke-Tests fuer Validierung, Pilotmodus und nutzerfreundliche Fehlermeldungen

## Livegang-Ampelbewertung
- Sprache / Rechtschreibung: Gelb
- Mobile Darstellung: Gelb
- Performance: Gelb
- SEO: Gelb
- Backend / API: Gelb
- Auth / Login: Gelb
- Datenschutz / Impressum / AGB: Rot
- Sicherheit: Gelb
- Supportbarkeit: Gelb
- Deployment: Gelb

## Realistische Livegang-Einschaetzung
Ein kontrollierter Launch ist realistisch, aber noch nicht heute. Fuer einen produktionsnahen Go-Live muessen vor allem drei Bereiche geschlossen werden:

1. Vollstaendige Lokalisierung aller sichtbaren Seiten und Fehlermeldungen
2. Finale Rechtstexte fuer Impressum, Datenschutz und AGB
3. Performance- und SEO-Feinschliff bei Bildern, Image-Optimierung und mehrsprachigen Metadaten

## Konkrete naechste Schritte
1. Alle verbleibenden hardcodierten UI-Texte auf Seitenebene ueber `app/i18n.ts` ziehen.
2. Backend-/Supabase-Fehlercodes in sprachneutrale App-Fehler uebersetzen.
3. `hilfino-logo.png` fuer Brand-/CMS-Zwecke getrennt vom neuen OG-Bild weiter optimieren oder ersetzen.
4. Remote-Image-Strategie fuer `next/image` festlegen und `unoptimized` dort entfernen, wo Host-Konfiguration moeglich ist.
5. Locale-spezifische Metadata-Strategie fuer `de`, `en` und `tr` definieren.
6. Smoke-Tests auf weitere kritische Flows erweitern, z. B. Auth- und Settings-Helfer.
