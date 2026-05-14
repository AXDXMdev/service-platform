# Hilfinio Mobile Launch Readiness

Stand: 2026-05-03

## Aktueller Zustand der App

- Die iOS-App liegt im Ordner `mobile/` und ist aktuell eine Expo Managed App.
- Es gibt keinen nativen `ios/` Ordner und kein vorbereitetes Xcode-Projekt im Repo.
- Der aktuelle Mobile-Stack ist:
  - `expo@^53.0.0`
  - `react@19.0.0`
  - `react-native@0.79.6`
- Die App startet lokal im iPhone Simulator ueber Expo Go.
- Die App nutzt einen sicheren Dual-Mode:
- ohne Expo Public Supabase Variablen: Mock-Modus
- mit Expo Public Supabase Variablen: echter Supabase Login sowie echter Service- und Request-Flow

## Technischer Status

### Gruen

- Expo Managed Setup ist fuer die naechsten 3 bis 4 Monate eine gute Wahl.
- `react-native` wurde auf die von Expo erwartete Version `0.79.6` angeglichen.
- `npx expo-doctor` laeuft gruens.
- `npm install` und `npm run typecheck` laufen erfolgreich.
- App-Name, Bundle Identifier, Scheme, Icon und Splash sind in `mobile/app.json` vorbereitet.
- Die App hat jetzt eine saubere Mock-Service-Schicht fuer:
  - `authService`
  - `providerService`
  - `requestService`
  - `userService`
  - `supportService`
- Die App kann direkt auf Supabase umschalten, sobald `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind.

### Gelb

- Die Navigation ist noch eine einfache lokale Screen-State-Navigation in `mobile/App.tsx`.
- Es gibt noch keine produktiven API-Endpunkte speziell fuer Mobile.
- `npm run ios` kann bei mehreren gebooteten Simulatoren das falsche Geraet waehlen.
- Es gibt noch keinen `lint` Script im Mobile-Projekt.

### Rot

- Keine finale Datenschutz-/Impressum-/AGB-Auslieferung in der App.
- Keine Beta-/TestFlight-/App-Store-Release-Pipeline.
- Keine Tests fuer Mobile-Flows.
- Keine Push-Notifications, kein Crash-Reporting, kein Monitoring.

## Gefundene Probleme

- `npm run ios` startete anfangs nicht sauber, weil:
  - `xcode-select` auf die Command Line Tools statt auf Xcode zeigte.
  - `xcrun simctl` deshalb nicht verfuegbar war.
- Expo versuchte zeitweise, Expo Go auf einer Apple Watch zu installieren.
  - Ursache: falsches Zielgeraet im Simulator-Setup.
- Die App war funktional, aber zu monolithisch:
  - direkte Mock-Nutzung
  - keine klare Service-Schicht
  - keine Support-/Settings-/Legal-Screens
  - kaum Lade-/Fehlerzustaende
- Mobile hatte keinen klaren Icon-/Splash-Setup.
- Mobile hat keinen `lint` Script.
- `npm audit` meldet moderate Transitvulnerabilities im Expo-Stack, aber nur mit riskantem `--force` downgrade-fixbar.

## Behobene Probleme

- Xcode-/Simulator-Startpfad lokal verifiziert.
- Expo/RN Versionsabgleich auf `react-native@0.79.6`.
- `doctor` Script in `mobile/package.json` ergaenzt.
- `ios:simulator` Script fuer den sichereren Metro-/Simulator-Start ergaenzt.
- Icon und Splash in Expo-Konfiguration vorbereitet.
- Supabase Client fuer Expo mit AsyncStorage Session-Persistenz vorbereitet.
- Auth, Service-Liste und Request-Erstellung koennen direkt gegen Supabase laufen.
- App-Struktur verbessert:
  - neue Service-Schicht
  - mehr MVP-Screens
  - Support/Kontakt-Screen
  - Einstellungen
  - Datenschutz/Impressum/AGB Platzhalter
  - Anbieterprofil und Kundenprofil
  - Lade-, Such- und Fehlerzustaende
- Mockdaten jetzt sauberer von der UI getrennt.

## Offene Risiken

- Support, Einstellungen und Rechtstexte sind weiterhin nicht produktiv verbunden.
- Rechtstexte sind Platzhalter und blockieren Beta und Release.
- Es gibt keine stabile Navigationsbibliothek wie Expo Router oder React Navigation.
- Es gibt keine E2E- oder Component-Tests.
- `npm audit` bleibt offen:
  - `postcss <8.5.10`
  - `uuid <14.0.0`
  - vorgeschlagener Fix wuerde ueber `npm audit fix --force` einen riskanten Expo-Downgrade ausloesen

## Bestehende Web-/API-Lage

Die Website ist aktuell nicht als mobile-freundliche REST-API organisiert.

Was real existiert:

- `GET /api/site-settings`
- `GET /api/admin/support`
- `GET|POST|DELETE /admin/session`
- `GET /admin/role`

Wichtige Beobachtung:

- Die meisten Endnutzer-Flows der Website nutzen direkt den Supabase Client im Frontend.
- Beispiele:
  - Login/Registrierung ueber Supabase Auth
  - Services lesen ueber `services`
  - Favoriten ueber `favorites`
  - Anfragen ueber `requests`
  - Chat ueber `chat_messages`

Fazit:

- Fuer die App gibt es aktuell noch keine vollstaendige dedizierte HTTP-API.
- Realistisch gibt es zwei spaetere Wege:
  - Mobile App nutzt ebenfalls Supabase direkt mit sauberer mobiler Session und strengen RLS-Regeln.
  - Oder wir bauen gezielt eine serverseitige API fuer Mobile-Auth, Requests, Favorites und Support.

## Benoetigte API-Endpunkte

Falls eine dedizierte Mobile-API gebaut werden soll, sind diese Endpunkte realistisch und benoetigt:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`
- `GET /services?query=&category=&city=`
- `GET /services/:id`
- `POST /requests`
- `GET /me/requests`
- `GET /me/favorites`
- `POST /favorites`
- `DELETE /favorites/:serviceId`
- `GET /support/channels`
- `POST /support/requests`

Wenn stattdessen Supabase direkt genutzt wird:

- mobile session handling
- sichere Deep-Link- oder Magic-Link-Flows
- ueberpruefte RLS fuer `services`, `requests`, `favorites`, `chat_messages`, `profiles`

## Xcode- und iOS-Setup-Anleitung

### Status

- Xcode ist lokal nutzbar.
- Expo Go startet auf dem iPhone Simulator.
- Die App laeuft im Expo Managed Workflow.
- Ein echter Supabase-Livepfad ist vorbereitet, wenn die Expo Public Env-Variablen gesetzt sind.

### Einmalige Einrichtung

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
sudo xcodebuild -license accept
xcrun simctl help
```

### iPhone Simulator sicher starten

```bash
open -a Simulator
xcrun simctl boot "iPhone 16 Pro"
```

### App lokal starten

```bash
cd /Users/alaadinadem/service-platform/mobile
npm install
npm run typecheck
npm run ios:simulator
```

Fuer echten Supabase-Betrieb zusaetzlich:

```bash
cd /Users/alaadinadem/service-platform/mobile
cp .env.example .env
```

Dann in `.env` setzen:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Wenn Expo Go nicht automatisch in der App landet:

- iPhone Simulator offen lassen
- Expo Go im Simulator oeffnen
- Metro URL laden

### Wichtige lokale Stolperstelle

- `npm run ios` kann bei gleichzeitig aktiver Apple Watch oder mehreren Simulatoren das falsche Geraet waehlen.
- Deshalb fuer lokale Arbeit bevorzugt:
  - `npm run ios:simulator`

## iOS-Konfiguration

### App-Name

- `Hilfinio`

### Bundle Identifier

- `de.hilfinio.mobile`

### Icon

- vorbereitet ueber `mobile/assets/icon.png`
- spaeter fuer App Store in finaler CI-/Design-Qualitaet gegenpruefen

### Splash

- vorbereitet ueber `mobile/assets/splash.png`
- spaeter UX-seitig pruefen, ob das Motiv fuer Launchscreen passend reduziert ist

### Permissions

- aktuell keine iOS Permissions konfiguriert
- gut fuer MVP, solange keine Kamera, Fotos, Standort, Push oder Mikrofon-Funktionen eingebaut werden

### App Transport Security

- keine ATS-Ausnahmen gesetzt
- gut so, solange produktive Endpunkte spaeter nur via HTTPS angesprochen werden

### Deep Links

- Custom Scheme vorhanden: `hilfinio://`
- Universal Links / Associated Domains noch nicht vorbereitet

### Push Notifications

- noch nicht vorhanden
- fuer spaeter als TODO vorgesehen

## Apple Developer und TestFlight Voraussetzungen

Vor TestFlight und App Store braucht Hilfinio mindestens:

- aktiven Apple Developer Account
- eindeutigen App-Eintrag in App Store Connect
- finale Bundle-/Signing-Konfiguration
- Datenschutzangaben fuer App Store Connect
- finale Rechtstexte
- App Icon, Splash und Metadaten in finaler Version
- Build-/Release-Prozess ueber EAS Build oder spaeter nativen Build-Weg
- Beta-Testplan mit realen Testpersonen und Feedback-Routine

## Qualitaet und Stabilitaet

Ausgefuehrt:

```bash
cd mobile
npm install
npm run typecheck
npm run doctor
npm audit --omit=dev --audit-level=moderate
```

Ergebnis:

- `npm install`: erfolgreich
- `npm run typecheck`: erfolgreich
- `npm run doctor`: erfolgreich
- `npm run lint`: nicht vorhanden
- `npm audit`: moderate Risiken bleiben offen, kein sicherer non-breaking Fix verfuegbar

Simulator-Status:

- App startet im iPhone Simulator ueber Expo Go
- manuelle iPhone-Steuerung ist derzeit stabiler als blindes `npm run ios`

## Launch-Readiness in 3 bis 4 Monaten

### Was bereits gut ist

- Expo Managed Setup ist schnell und fuer MVP gut geeignet.
- Das Mobile-Branding ist vorbereitet.
- Die App hat jetzt die wichtigsten MVP-Screens als Vorversion.
- Die Service-Schicht ist vorbereitet und trennt UI von Mock-Backend.
- Login, Service-Liste und Request-Erstellung koennen jetzt direkt ueber Supabase laufen.
- Xcode und Simulator lassen sich lokal betreiben.

### Was kritisch fehlt

- echte Favoriten-/Profil-/Support-Logik
- Rechtstexte
- Tests
- Release- und Monitoring-Pipeline

### Was vor Beta-Test fertig sein muss

- belastbare Services fuer Profil, Favoriten und Support
- Support-Fluss mit echtem Ziel
- Datenschutz-/Impressum-Anzeige
- erster stabiler Navigationsstandard
- Beta-geeignete Crashfreiheit auf mehreren iPhones

### Was vor App-Store-Release fertig sein muss

- finale Mobile-Datenstrategie und abgesicherte RLS-Pruefung
- finale rechtliche Texte
- Store-Listing, Screenshots, Datenschutzangaben
- finaler Build-Weg
- Monitoring und Fehlertracking
- TestFlight-Runde mit Bugfixes

### Was nach Launch kommen kann

- Push Notifications
- Offline-Zwischenspeicherung
- komplexere Favoriten-/Chat-UX
- In-App Bewertungen
- tiefere Personalisierung

## Ampelbewertung

- Gruen: Expo Managed Basis, TypeScript, Simulator-Start, Branding-Grundlagen, Mock-Service-Schicht
- Gelb: Navigation, Einstellungen, rechtliche Platzhalter, Support-Fluss, dedizierte Mobile-API, Linting
- Rot: TestFlight/App Store Pipeline, Rechtstexte, Tests, Monitoring, produktiver Support- und Profil-Funktionsumfang

## 3 bis 4 Monats-Roadmap

### Monat 1

- App lauffaehig machen und Xcode/Simulator setup stabilisieren
- Navigation stabilisieren
- MVP-Screens fertigstellen
- Mockdaten sauber trennen
- Icon, Splash, Bundle Setup vorbereiten

### Monat 2

- API-Anbindung oder mobile Supabase-Strategie umsetzen
- Auth/Login registrieren
- Anfrage-System produktiv verbinden
- Profile und Nutzerstatus anbinden
- Supportfunktion mit echtem Ziel anbinden

### Monat 3

- Tests einfuehren
- Fehlerbehebung
- Datenschutz/Impressum/AGB finalisieren
- TestFlight vorbereiten
- Performance und UX feinschleifen

### Monat 4

- App Store Vorbereitung
- letzte Bugs fixen
- Monitoring und Crash-Reporting anschliessen
- Release Candidate bauen
- Livegang

## Prioritaetenliste

1. Mobile Datenstrategie final bestaetigen: Supabase direkt oder spaeter dedizierte Mobile-API
2. Profil, Favoriten und Support nach dem jetzigen Supabase-Grundpfad produktiv machen
3. Navigation professionalisieren
4. Rechtstexte und App-Store Pflichtangaben vorbereiten
5. Beta- und TestFlight-Pipeline aufsetzen
6. Tests und Monitoring ergaenzen

## Ehrliche Einschaetzung

3 bis 4 Monate sind realistisch, wenn:

- wir den Mobile-Scope als MVP diszipliniert halten
- wir keine grossen nativen Sonderfunktionen hineinziehen
- Auth und Datenstrategie im ersten Monat entschieden werden
- Rechtliches und TestFlight nicht bis ganz zum Schluss geschoben werden

Nicht realistisch waere es, in derselben Zeit parallel noch eine grosse native Sonderlogik, Push, Offline, Payments und aufwendige Chat-Funktionen produktionsreif mitzunehmen.
