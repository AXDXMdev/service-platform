# Hilfinio / Taskora - Performance Report

Stand: 2026-05-17

## Status

Performance Status: 🟠 solide Grundlage, aber Hydration und Client-Bundle muessen vor offenem Launch reduziert werden.

## Build Snapshot

- Next.js 16.2.4 mit Turbopack.
- Production Build erfolgreich.
- 54 statische/dynamische App-Routen wurden generiert.
- 27 Pages, davon viele Client Components.
- Globaler `app/loading.tsx` wurde ergaenzt.
- PWA Manifest wurde ergaenzt.

## Implementiert in diesem Durchlauf

- Globaler Loading Skeleton als App-Router-Fallback.
- PWA Manifest fuer installierbare Grundstruktur.
- Zentrale Env-Validierung ohne Build-Crash bei fehlenden optionalen Werten.
- Mutationsrouten validieren frueher und einheitlicher, wodurch unnoetige Service-/DB-Arbeit reduziert wird.

## 🔴 Kritisch

- 50 Dateien in `app/` und `components/` starten mit `"use client"`. Das ist fuer Lighthouse, TTI und mobile Hydration der groesste Hebel.
- Mobile App nutzt teilweise Mockdaten; reale Netzwerklatenz, Caching und Offline-Verhalten sind noch nicht realistisch optimiert.

## 🟠 Wichtig

- Home, Services, Detail, Dashboard und Account-Flows sollten in Server Shell + kleine Client Islands zerlegt werden.
- Public Catalog APIs koennen mit Cache Tags/ISR staerker optimiert werden.
- Route-spezifische `loading.tsx` fehlen fuer Services, Service Detail, Dashboard, Admin und Chat.
- Bundle-Analyse fehlt. Empfohlen: `ANALYZE=true` oder Next Bundle Analyzer equivalent.

## 🟡 Mittel

- Bilder werden ueber Next Image Remote Patterns begrenzt, aber Upload-Assets sollten responsive Varianten/Thumbnails bekommen.
- Listen brauchen Pagination/Virtualization, sobald echte Marktplatzdaten wachsen.
- Admin Dashboard sollte Tabellen serverseitig filtern/paginieren statt groessere Listen clientseitig zu bearbeiten.
- Font-Strategie ist okay, aber Brand/Webfont-Wirkung sollte mit Lighthouse mobile gemessen werden.

## 🟢 Gut

- Next/React Versionen sind aktuell und enthalten React 19.2.4.
- `site-settings` nutzt `Cache-Control: public, max-age=20, stale-while-revalidate=120`.
- API Route Handler sind dynamisch dort, wo Auth/DB noetig ist.
- Speed Insights ist eingebunden.

## Zielbild Lighthouse 90+

1. Client Pages reduzieren.
2. Critical CSS/Font/Layout shift messen.
3. Hero und Service Cards mit echten Bilddimensionen/Thumbnails.
4. Cache Tags fuer CMS/Public Catalog.
5. Suspense Grenzen pro datenlastigem Segment.
6. Bundle Budget in CI pruefen.
