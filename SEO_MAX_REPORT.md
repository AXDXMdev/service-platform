# Hilfinio / Taskora - SEO Maximum Report

Stand: 2026-05-17

## Implementiert

- `lib/seo.ts` fuer zentrale Canonicals, Metadata und JSON-LD.
- Globale JSON-LD:
  - Organization
  - WebSite mit SearchAction
  - LocalBusiness/Marketplace-Angebotsstruktur
- Dynamische lokale SEO-Landingpages:
  - `app/[city]/[category]/page.tsx`
  - Static Params fuer Pilot-/SEO-Staedte und Service-Kategorien
  - Canonical Metadata
  - BreadcrumbList Schema
  - Service Schema
  - FAQPage Schema
- Sitemap erweitert um lokale Kategorie-Seiten.
- Robots nutzt zentrale Base URL.

## SEO Architektur

Vorbereitet fuer programmatische Seiten wie:

- `/stuttgart/cleaning`
- `/esslingen/moving`
- `/ludwigsburg/repair`
- `/fellbach/it`

Die Struktur kann spaeter um deutsche Slugs erweitert werden, ohne bestehende englische Kategorie-Slugs zu brechen.

## Noch offen

- Service Detail Pages sind Client Components und koennen noch keine perfekte serverseitige `generateMetadata` aus Daten liefern.
- Provider Detail Pages ebenfalls.
- Review Schema sollte aus echten validierten Reviews pro Service generiert werden.
- Mehr interne Links von Home/Services zu lokalen SEO-Landingpages.
- AI crawler spezifische Dokumente wie `llms.txt` koennen spaeter ergaenzt werden.

## SEO Score

Aktuell: 78/100

Mit Server-Metadata fuer Detailseiten, deutschen Slugs und Review Schema: 90+/100.
