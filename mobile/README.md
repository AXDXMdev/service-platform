# Hilfinio iOS MVP

Erste Expo-Vorversion fuer Hilfinio. Die App ist bewusst schlank, lauffaehig und nutzt klar gekennzeichnete Mockdaten in `src/data/mockData.ts`.

## Starten

```bash
cd mobile
npm install
npm run typecheck
npm run ios
```

Voraussetzungen fuer iOS:

- macOS mit Xcode und installiertem iOS Simulator.
- Expo CLI wird ueber die lokale `expo` Dependency ausgefuehrt.
- Falls Expo aus Versehen eine Apple Watch oeffnet, zuerst einen iPhone-Simulator starten und Expo Go dort oeffnen.

Alternativ:

```bash
npm run start
```

Dann in Expo die iOS-Option auswaehlen oder per Expo Go testen.

## Struktur

- `App.tsx`: zentrale MVP-Navigation fuer Onboarding, Auth, Home, Profile, Support, Einstellungen und Rechtstexte.
- `src/components/`: wiederverwendbare UI-Bausteine.
- `src/data/mockData.ts`: MOCK DATA, spaeter durch echte API/Supabase-Daten ersetzen.
- `src/services/`: klar getrennte Service-Schicht fuer Auth, Anbieter, Anfragen, Nutzer und Support.
- `src/lib/supabase.ts`: Supabase Client fuer Expo mit Session-Persistenz ueber AsyncStorage.
- `src/api/client.ts`: gemeinsame Mock-/API-Konfiguration fuer die Service-Schicht.
- `src/theme.ts`: Hilfinio Farben und UI-Konstanten.
- `assets/`: App-Icon und Splash-Assets fuer Expo/Xcode-Vorbereitung.

## Simulator-Hinweis

Wenn mehrere Simulatoren laufen, kann Expo das falsche Geraet waehlen. Sicherer Ablauf:

```bash
xcrun simctl list devices available
xcrun simctl boot "iPhone 16 Pro"
npm run start
```

Danach im iPhone Simulator Expo Go oeffnen oder die Metro-URL ueber Expo Go laden.

Schneller Helfer:

```bash
npm run ios:simulator
```

## Echter Supabase-Modus

Die App arbeitet aktuell mit einem sicheren Fallback:

- mit `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY`: echter Supabase Login und echter Service-/Request-Flow
- ohne diese Variablen: stabiler Mock-Modus

Einrichtung:

```bash
cp .env.example .env
```

Dann Werte eintragen:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Hinweis:

- Nur `EXPO_PUBLIC_*` Variablen sind fuer Expo Client-Code gedacht.
- Niemals `SUPABASE_SERVICE_ROLE_KEY` in die Mobile-App legen.

## Spaeter Benoetigte API-Endpunkte

- `POST /auth/login` oder mobile Supabase Auth
- `POST /auth/register` oder mobile Supabase Auth
- `GET /services?query=&category=&city=`
- `GET /services/:id`
- `POST /requests`
- `GET /me`
- `GET /me/requests`
- `GET /support/channels`
- `POST /support/requests`

Falls Supabase direkt aus der App genutzt wird, muessen RLS-Policies fuer mobile Sessions identisch streng greifen wie in der Website.

## Nicht Produktionsreif

- Support ist noch Mock/Platzhalter.
- Keine Push Notifications.
- Keine Offline-Speicherung.
- Keine Zahlungslogik.
- Keine echte Medienanzeige fuer Anbieterbilder.
- Rechtstexte in der App sind noch Platzhalter.
