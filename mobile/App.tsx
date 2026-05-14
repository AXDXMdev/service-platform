import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Button } from "./src/components/Button"
import { ProviderCard } from "./src/components/ProviderCard"
import { TextField } from "./src/components/TextField"
import { serviceMode } from "./src/api/client"
import { legalDocuments } from "./src/data/mockData"
import { login, logout, register } from "./src/services/authService"
import { getCategories, getProviderById, searchProviders } from "./src/services/providerService"
import { getMyRequests, submitBookingRequest } from "./src/services/requestService"
import { getSupportChannels, sendSupportRequest } from "./src/services/supportService"
import { getAppSettings, getCurrentUserProfile } from "./src/services/userService"
import { colors } from "./src/theme"
import type {
  AppSettings,
  AuthMode,
  Category,
  CustomerProfile,
  Provider,
  RequestSummary,
  Screen,
  SupportChannel,
} from "./src/types"

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding")
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [categories, setCategories] = useState<Category[]>([])
  const [providerResults, setProviderResults] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [supportChannels, setSupportChannels] = useState<SupportChannel[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [query, setQuery] = useState("")
  const [bookingDate, setBookingDate] = useState("")
  const [bookingBudget, setBookingBudget] = useState("")
  const [bookingMessage, setBookingMessage] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authName, setAuthName] = useState("")
  const [supportEmail, setSupportEmail] = useState("")
  const [supportTopic, setSupportTopic] = useState("Allgemeine Frage")
  const [supportMessage, setSupportMessage] = useState("")
  const [selectedLegalDocumentId, setSelectedLegalDocumentId] = useState("datenschutz")
  const [reloadToken, setReloadToken] = useState(0)
  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submittingAuth, setSubmittingAuth] = useState(false)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [submittingSupport, setSubmittingSupport] = useState(false)

  const selectedCategoryLabel =
    categories.find((category) => category.id === selectedCategory)?.label ?? "Alle Services"
  const selectedLegalDocument =
    legalDocuments.find((document) => document.id === selectedLegalDocumentId) ?? legalDocuments[0]

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setBootLoading(true)
      setBootError(null)

      try {
        const [categoryData, providerData, customerData, requestData, channelData, settingsData] =
          await Promise.all([
            getCategories(),
            searchProviders("", undefined),
            getCurrentUserProfile(),
            getMyRequests(),
            getSupportChannels(),
            getAppSettings(),
          ])

        if (!active) return

        setCategories(categoryData)
        setProviderResults(providerData)
        setSelectedProvider(providerData[0] ?? null)
        setCustomer(customerData)
        setRequests(requestData)
        setSupportChannels(channelData)
        setSettings(settingsData)
        setSupportEmail(customerData?.email ?? "")
      } catch (error) {
        if (!active) return
        setBootError(error instanceof Error ? error.message : "Die App konnte nicht vorbereitet werden.")
      } finally {
        if (active) {
          setBootLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [reloadToken])

  useEffect(() => {
    if (bootLoading || bootError) return

    let active = true

    async function loadResults() {
      setSearchLoading(true)
      setSearchError(null)

      try {
        const results = await searchProviders(query, selectedCategory)
        if (!active) return
        setProviderResults(results)
      } catch (error) {
        if (!active) return
        setSearchError(
          error instanceof Error ? error.message : "Die Suche konnte nicht aktualisiert werden."
        )
      } finally {
        if (active) {
          setSearchLoading(false)
        }
      }
    }

    void loadResults()

    return () => {
      active = false
    }
  }, [bootError, bootLoading, query, selectedCategory])

  async function openProvider(providerId: string, nextScreen: Screen = "serviceDetail") {
    const provider = await getProviderById(providerId)
    if (!provider) {
      Alert.alert("Nicht gefunden", "Das Anbieterprofil konnte nicht geladen werden.")
      return
    }

    setSelectedProvider(provider)
    setScreen(nextScreen)
  }

  async function submitAuth() {
    setSubmittingAuth(true)

    try {
      const result =
        authMode === "login"
          ? await login({ email: authEmail, password: authPassword })
          : await register({
              email: authEmail,
              password: authPassword,
              displayName: authName,
            })

      setCustomer(result.user)
      setSupportEmail(result.user.email)
      setScreen("home")
    } catch (error) {
      Alert.alert("Anmeldung fehlgeschlagen", error instanceof Error ? error.message : "Bitte Eingaben pruefen.")
    } finally {
      setSubmittingAuth(false)
    }
  }

  async function submitBooking() {
    if (!selectedProvider) return

    setSubmittingBooking(true)

    try {
      const result = await submitBookingRequest({
        providerId: selectedProvider.id,
        date: bookingDate,
        budget: bookingBudget,
        message: bookingMessage,
      })

      if (result.ok) {
        setRequests((current) => [
          {
            id: result.requestId,
            providerName: selectedProvider.name,
            serviceTitle: selectedProvider.title,
            status: "pending",
            dateLabel: bookingDate,
          },
          ...current,
        ])

        setCustomer((current) =>
          current
            ? {
                ...current,
                requestCount: current.requestCount + 1,
              }
            : current
        )

        setBookingDate("")
        setBookingBudget("")
        setBookingMessage("")
        Alert.alert("Anfrage vorbereitet", "Die Demo-Anfrage wurde vorgemerkt.")
        setScreen("customerProfile")
      }
    } catch (error) {
      Alert.alert("Anfrage fehlgeschlagen", error instanceof Error ? error.message : "Bitte erneut versuchen.")
    } finally {
      setSubmittingBooking(false)
    }
  }

  async function submitSupport() {
    setSubmittingSupport(true)

    try {
      const result = await sendSupportRequest({
        email: supportEmail,
        topic: supportTopic,
        message: supportMessage,
      })

      if (result.ok) {
        setSupportMessage("")
        Alert.alert("Support vorgemerkt", `Demo-Ticket ${result.ticketId} wurde erzeugt.`)
      }
    } catch (error) {
      Alert.alert("Support fehlgeschlagen", error instanceof Error ? error.message : "Bitte erneut versuchen.")
    } finally {
      setSubmittingSupport(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {bootLoading ? (
            <LoadingState />
          ) : bootError ? (
            <ErrorState message={bootError} onRetry={() => setReloadToken((current) => current + 1)} />
          ) : (
            <>
              {screen === "onboarding" && (
                <View style={styles.hero}>
                  <View style={styles.logoMark}>
                    <Text style={styles.logoMarkText}>H</Text>
                  </View>
                  <Text style={styles.brand}>Hilfinio</Text>
                  <Text style={styles.h1}>Lokale Services schnell und vertrauensvoll buchen.</Text>
                  <Text style={styles.copy}>
                    Finde gepruefte Anbieter in deiner Naehe, vergleiche Profile und sende deine
                    Anfrage in wenigen Schritten.
                  </Text>
                  <View style={styles.buttonStack}>
                    <Button label="Loslegen" onPress={() => setScreen("auth")} />
                    <Button
                      label="Direkt Demo ansehen"
                      variant="secondary"
                      onPress={() => setScreen("home")}
                    />
                  </View>
                </View>
              )}

              {screen === "auth" && (
                <View style={styles.panel}>
                  <Text style={styles.eyebrow}>
                    {authMode === "login" ? "Login" : "Registrierung"}
                  </Text>
                  <Text style={styles.h2}>
                    {authMode === "login" ? "Willkommen zurueck" : "Konto erstellen"}
                  </Text>
                  <View style={styles.form}>
                    {authMode === "register" ? (
                      <TextField
                        placeholder="Name oder Firma"
                        value={authName}
                        onChangeText={setAuthName}
                      />
                    ) : null}
                    <TextField
                      placeholder="E-Mail"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={authEmail}
                      onChangeText={setAuthEmail}
                    />
                    <TextField
                      placeholder="Passwort"
                      secureTextEntry
                      value={authPassword}
                      onChangeText={setAuthPassword}
                    />
                  </View>
                  <Text style={styles.notice}>
                    {serviceMode === "supabase"
                      ? "Live-Modus: Login nutzt Supabase Auth mit Expo Session-Speicherung."
                      : "Demo-Modus: Sobald EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY gesetzt sind, nutzt die App echten Supabase-Login."}
                  </Text>
                  <Button
                    label={
                      submittingAuth
                        ? "Bitte warten..."
                        : authMode === "login"
                          ? "Einloggen"
                          : "Registrieren"
                    }
                    disabled={submittingAuth}
                    onPress={submitAuth}
                  />
                  <Button
                    label={
                      authMode === "login"
                        ? "Ich brauche ein Konto"
                        : "Ich habe schon ein Konto"
                    }
                    variant="secondary"
                    onPress={() =>
                      setAuthMode(authMode === "login" ? "register" : "login")
                    }
                  />
                </View>
              )}

              {screen === "home" && (
                <View style={styles.section}>
                  <Header
                    title="Services finden"
                    subtitle="Hilfinio Demo"
                    primaryActionLabel="Profil"
                    onPrimaryAction={() =>
                      setScreen(customer ? "customerProfile" : "auth")
                    }
                    secondaryActionLabel="Support"
                    onSecondaryAction={() =>
                      setScreen(customer ? "support" : "auth")
                    }
                  />
                  <TextField
                    placeholder="Dienstleistung, Stadt oder Anbieter suchen"
                    value={query}
                    onChangeText={setQuery}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                  >
                    <Chip
                      label="Alle"
                      active={!selectedCategory}
                      onPress={() => setSelectedCategory(undefined)}
                    />
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.label}
                        active={selectedCategory === category.id}
                        onPress={() => setSelectedCategory(category.id)}
                      />
                    ))}
                  </ScrollView>
                  <View style={styles.resultHeader}>
                    <View>
                      <Text style={styles.eyebrow}>{selectedCategoryLabel}</Text>
                      <Text style={styles.resultTitle}>
                        {providerResults.length === 1
                          ? "1 Anbieter gefunden"
                          : `${providerResults.length} Anbieter gefunden`}
                      </Text>
                    </View>
                    <Text style={styles.demoBadge}>
                      {serviceMode === "supabase" ? "Supabase" : "Mock"}
                    </Text>
                  </View>
                  <ActionRow
                    items={[
                      {
                        label: "Anfragen",
                        value: `${requests.length}`,
                        onPress: () => setScreen(customer ? "customerProfile" : "auth"),
                      },
                      {
                        label: "Rechtliches",
                        value: "3 Texte",
                        onPress: () => setScreen("legal"),
                      },
                    ]}
                  />
                  {searchLoading ? <InlineNotice label="Suche aktualisiert..." /> : null}
                  {searchError ? <InlineNotice label={searchError} tone="warning" /> : null}
                  <View style={styles.list}>
                    {providerResults.length > 0 ? (
                      providerResults.map((provider) => (
                        <ProviderCard
                          key={provider.id}
                          provider={provider}
                          onPress={() => void openProvider(provider.id)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        title="Keine Treffer"
                        copy="Passe Suche oder Kategorie an. Weitere Anbieter folgen mit der echten API-Anbindung."
                      />
                    )}
                  </View>
                </View>
              )}

              {screen === "serviceDetail" && selectedProvider ? (
                <View style={styles.section}>
                  <Back label="Zur Suche" onPress={() => setScreen("home")} />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>
                      {selectedProvider.city}, {selectedProvider.district}
                    </Text>
                    <Text style={styles.h2}>{selectedProvider.title}</Text>
                    <Text style={styles.copy}>{selectedProvider.description}</Text>
                    <View style={styles.quickFacts}>
                      <QuickFact label="Preis ab" value={`${selectedProvider.priceFrom} EUR`} />
                      <QuickFact
                        label="Status"
                        value={selectedProvider.verified ? "Verifiziert" : "In Pruefung"}
                      />
                    </View>
                    <View style={styles.tags}>
                      {selectedProvider.tags.map((tag) => (
                        <Text key={tag} style={styles.tag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.detailLine}>Anbieter: {selectedProvider.name}</Text>
                    <Text style={styles.detailLine}>
                      Bewertung: {selectedProvider.rating.toFixed(1)} aus{" "}
                      {selectedProvider.reviewCount} Bewertungen
                    </Text>
                    <Text style={styles.detailLine}>
                      Verfuegbar: {selectedProvider.availability}
                    </Text>
                    <Button
                      label="Anbieterprofil ansehen"
                      variant="secondary"
                      onPress={() => setScreen("providerProfile")}
                    />
                    <Button
                      label="Buchungsanfrage starten"
                      onPress={() => setScreen("booking")}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "providerProfile" && selectedProvider ? (
                <View style={styles.section}>
                  <Back label="Zum Service" onPress={() => setScreen("serviceDetail")} />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Anbieterprofil</Text>
                    <Text style={styles.h2}>{selectedProvider.name}</Text>
                    <Text style={styles.copy}>{selectedProvider.bio}</Text>
                    <View style={styles.quickFacts}>
                      <QuickFact
                        label="Abgeschlossene Jobs"
                        value={String(selectedProvider.completedJobs)}
                      />
                      <QuickFact
                        label="Antwortzeit"
                        value={selectedProvider.responseTime}
                      />
                    </View>
                    <View style={styles.infoCard}>
                      <InfoLine label="Servicegebiet" value={selectedProvider.serviceArea} />
                      <InfoLine
                        label="Sprachen"
                        value={selectedProvider.languages.join(", ")}
                      />
                      <InfoLine label="Verfuegbarkeit" value={selectedProvider.availability} />
                    </View>
                    <Button
                      label="Anfrage senden"
                      onPress={() => setScreen("booking")}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "booking" && selectedProvider ? (
                <View style={styles.section}>
                  <Back label="Zum Anbieter" onPress={() => setScreen("providerProfile")} />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Buchungsanfrage</Text>
                    <Text style={styles.h2}>{selectedProvider.name}</Text>
                    <View style={styles.form}>
                      <TextField
                        placeholder="Wunschdatum, z. B. 18.05.2026"
                        value={bookingDate}
                        onChangeText={setBookingDate}
                      />
                      <TextField
                        placeholder="Budget optional, z. B. 120 EUR"
                        value={bookingBudget}
                        onChangeText={setBookingBudget}
                      />
                      <TextField
                        placeholder="Was soll erledigt werden?"
                        multiline
                        value={bookingMessage}
                        onChangeText={setBookingMessage}
                      />
                    </View>
                    <InlineNotice
                      label={
                        serviceMode === "supabase"
                          ? "Live-Modus: Die Anfrage wird in Supabase als Request gespeichert."
                          : "Demo-Modus: Die Anfrage wird lokal vorgemerkt und noch nicht an echte Anbieter uebertragen."
                      }
                    />
                    <Button
                      label={
                        submittingBooking ? "Bitte warten..." : "Anfrage vormerken"
                      }
                      disabled={submittingBooking}
                      onPress={submitBooking}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "customerProfile" && customer ? (
                <View style={styles.section}>
                  <Back label="Zurueck" onPress={() => setScreen("home")} />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Kundenprofil</Text>
                    <Text style={styles.h2}>{customer.name}</Text>
                    <Text style={styles.copy}>
                      Demo-Profil fuer Kundendaten, Favoriten und Anfragen. Die echte Session wird
                      spaeter serverseitig abgesichert.
                    </Text>
                    <View style={styles.quickFacts}>
                      <QuickFact
                        label="Anfragen"
                        value={String(customer.requestCount)}
                      />
                      <QuickFact
                        label="Favoriten"
                        value={String(customer.favoritesCount)}
                      />
                    </View>
                    <View style={styles.infoCard}>
                      <InfoLine label="E-Mail" value={customer.email} />
                      <InfoLine label="Stadt" value={customer.city} />
                      <InfoLine
                        label="Telefon verifiziert"
                        value={customer.verifiedPhone ? "Ja" : "Noch offen"}
                      />
                    </View>
                    <SectionTitle title="Letzte Anfragen" />
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <RequestRow key={request.id} request={request} />
                      ))
                    ) : (
                      <EmptyState
                        title="Noch keine Anfragen"
                        copy="Deine ersten Anfragen erscheinen hier, sobald die echte API oder Supabase-Anbindung aktiv ist."
                      />
                    )}
                    <ActionRow
                      items={[
                        {
                          label: "Support",
                          value: "Kontakt",
                          onPress: () => setScreen("support"),
                        },
                        {
                          label: "Einstellungen",
                          value: settings?.language ?? "DE",
                          onPress: () => setScreen("settings"),
                        },
                      ]}
                    />
                    <Button
                      label="Abmelden"
                      variant="secondary"
                      onPress={async () => {
                        try {
                          await logout()
                          setCustomer(null)
                          setRequests([])
                          setScreen("onboarding")
                        } catch (error) {
                          Alert.alert(
                            "Abmeldung fehlgeschlagen",
                            error instanceof Error ? error.message : "Bitte erneut versuchen."
                          )
                        }
                      }}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "support" && customer ? (
                <View style={styles.section}>
                  <Back
                    label="Zurueck"
                    onPress={() =>
                      setScreen(selectedProvider ? "providerProfile" : "customerProfile")
                    }
                  />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Support und Kontakt</Text>
                    <Text style={styles.h2}>Wir helfen dir weiter</Text>
                    <Text style={styles.copy}>
                      Fuer die MVP-App ist Support aktuell als klare Platzhalter- und Kontaktansicht
                      vorbereitet.
                    </Text>
                    {supportChannels.map((channel) => (
                      <View key={channel.id} style={styles.supportCard}>
                        <Text style={styles.supportTitle}>{channel.label}</Text>
                        <Text style={styles.copy}>{channel.description}</Text>
                        <Text style={styles.supportValue}>{channel.value}</Text>
                        <Text style={styles.supportAvailability}>{channel.availability}</Text>
                      </View>
                    ))}
                    <SectionTitle title="Nachricht vorbereiten" />
                    <View style={styles.form}>
                      <TextField
                        placeholder="Deine E-Mail"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={supportEmail}
                        onChangeText={setSupportEmail}
                      />
                      <TextField
                        placeholder="Thema, z. B. Buchung oder Konto"
                        value={supportTopic}
                        onChangeText={setSupportTopic}
                      />
                      <TextField
                        placeholder="Wie koennen wir helfen?"
                        multiline
                        value={supportMessage}
                        onChangeText={setSupportMessage}
                      />
                    </View>
                    <Button
                      label={
                        submittingSupport ? "Bitte warten..." : "Support vormerken"
                      }
                      disabled={submittingSupport}
                      onPress={submitSupport}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "settings" && settings ? (
                <View style={styles.section}>
                  <Back label="Zum Profil" onPress={() => setScreen("customerProfile")} />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Einstellungen</Text>
                    <Text style={styles.h2}>App und Konto</Text>
                    <Text style={styles.copy}>
                      Diese Werte sind in der MVP-App noch statisch. Echte Speicherung folgt mit
                      Nutzerkonto und Backend.
                    </Text>
                    <View style={styles.infoCard}>
                      <InfoLine label="Sprache" value={settings.language} />
                      <InfoLine label="Heimatstadt" value={settings.city} />
                      <InfoLine
                        label="Push Notifications"
                        value={settings.notificationsEnabled ? "Aktiv" : "Noch nicht angebunden"}
                      />
                      <InfoLine label="Support" value={settings.supportEmail} />
                      <InfoLine label="Datenschutz-Version" value={settings.privacyVersion} />
                    </View>
                    <ActionRow
                      items={[
                        {
                          label: "Datenschutz",
                          value: "Platzhalter",
                          onPress: () => {
                            setSelectedLegalDocumentId("datenschutz")
                            setScreen("legal")
                          },
                        },
                        {
                          label: "Impressum",
                          value: "Platzhalter",
                          onPress: () => {
                            setSelectedLegalDocumentId("impressum")
                            setScreen("legal")
                          },
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              {screen === "legal" && selectedLegalDocument ? (
                <View style={styles.section}>
                  <Back
                    label="Zurueck"
                    onPress={() =>
                      setScreen(settings ? "settings" : customer ? "customerProfile" : "home")
                    }
                  />
                  <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Rechtliches</Text>
                    <Text style={styles.h2}>{selectedLegalDocument.title}</Text>
                    <Text style={styles.copy}>
                      Platzhaltertexte fuer die mobile Vorversion. Vor TestFlight und Release muessen
                      die finalen Rechtstexte aus einer verifizierten Quelle kommen.
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chips}
                    >
                      {legalDocuments.map((document) => (
                        <Chip
                          key={document.id}
                          label={document.title}
                          active={selectedLegalDocument.id === document.id}
                          onPress={() => setSelectedLegalDocumentId(document.id)}
                        />
                      ))}
                    </ScrollView>
                    <View style={styles.infoCard}>
                      <Text style={styles.supportTitle}>{selectedLegalDocument.summary}</Text>
                      {selectedLegalDocument.body.map((paragraph) => (
                        <Text key={paragraph} style={styles.legalCopy}>
                          {paragraph}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Header(props: {
  title: string
  subtitle: string
  primaryActionLabel: string
  secondaryActionLabel: string
  onPrimaryAction: () => void
  onSecondaryAction: () => void
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brandSmall}>{props.subtitle}</Text>
        <Text style={styles.h2}>{props.title}</Text>
      </View>
      <View style={styles.headerActions}>
        <HeaderAction label={props.secondaryActionLabel} onPress={props.onSecondaryAction} />
        <HeaderAction label={props.primaryActionLabel} onPress={props.onPrimaryAction} />
      </View>
    </View>
  )
}

function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.headerButton}>
      <Text style={styles.headerButtonText}>{label}</Text>
    </Pressable>
  )
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function Back({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  )
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.quickFact}>
      <Text style={styles.quickFactLabel}>{label}</Text>
      <Text style={styles.quickFactValue}>{value}</Text>
    </View>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function ActionRow({
  items,
}: {
  items: Array<{ label: string; value: string; onPress: () => void }>
}) {
  return (
    <View style={styles.actionRow}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={item.onPress} style={styles.actionCard}>
          <Text style={styles.actionLabel}>{item.label}</Text>
          <Text style={styles.actionValue}>{item.value}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function RequestRow({ request }: { request: RequestSummary }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{request.serviceTitle}</Text>
        <Text style={styles.requestStatus}>{request.status}</Text>
      </View>
      <Text style={styles.copy}>{request.providerName}</Text>
      <Text style={styles.requestDate}>{request.dateLabel}</Text>
    </View>
  )
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  )
}

function InlineNotice({
  label,
  tone = "info",
}: {
  label: string
  tone?: "info" | "warning"
}) {
  return (
    <View
      style={[
        styles.inlineNotice,
        tone === "warning" ? styles.inlineNoticeWarning : null,
      ]}
    >
      <Text
        style={[
          styles.inlineNoticeText,
          tone === "warning" ? styles.inlineNoticeWarningText : null,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

function LoadingState() {
  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Hilfinio App</Text>
      <Text style={styles.h2}>Vorbereitung laeuft</Text>
      <Text style={styles.copy}>
        Kategorien, Demo-Profile, Support-Hinweise und Einstellungen werden geladen.
      </Text>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Startfehler</Text>
      <Text style={styles.h2}>App konnte nicht vorbereitet werden</Text>
      <Text style={styles.copy}>{message}</Text>
      <Button label="Erneut versuchen" onPress={onRetry} />
    </View>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    minHeight: 650,
    justifyContent: "center",
    gap: 18,
  },
  section: {
    gap: 16,
  },
  logoMark: {
    height: 58,
    width: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
    borderColor: "#bfdbfe",
    borderWidth: 1,
  },
  logoMarkText: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "900",
  },
  brand: {
    color: colors.brand,
    fontSize: 22,
    fontWeight: "900",
  },
  brandSmall: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  h1: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
  },
  h2: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  eyebrow: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  legalCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  panel: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  form: {
    gap: 10,
  },
  buttonStack: {
    gap: 10,
    marginTop: 8,
  },
  notice: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  headerButtonText: {
    color: colors.ink,
    fontWeight: "800",
  },
  chips: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    color: colors.ink,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  resultTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  demoBadge: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#d1fae5",
    color: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "900",
  },
  list: {
    gap: 12,
  },
  quickFacts: {
    flexDirection: "row",
    gap: 10,
  },
  quickFact: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#f8fbff",
    padding: 12,
  },
  quickFactLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  quickFactValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: colors.brandDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  detailLine: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#f8fbff",
    padding: 14,
    gap: 10,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 6,
  },
  actionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  actionValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  requestTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  requestStatus: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  requestDate: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  supportCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 6,
  },
  supportTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  supportValue: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
  },
  supportAvailability: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  inlineNotice: {
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineNoticeWarning: {
    backgroundColor: "#fff7ed",
  },
  inlineNoticeText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  inlineNoticeWarningText: {
    color: colors.warning,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  back: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: {
    color: colors.brand,
    fontWeight: "900",
  },
})
