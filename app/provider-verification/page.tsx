"use client"

import Link from "next/link"
import { useState } from "react"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import { LEGAL_CONSENT_VERSION } from "@/lib/legal"
import { authenticatedFetch } from "@/lib/authenticatedApi"
import { isValidEmail, normalizeText, toValidHttpUrls } from "@/lib/validation"

export default function ProviderVerificationPage() {
  const { content } = useSiteSettings()
  const pageContent = content["page:provider-verification"] as
    | { title?: string; subtitle?: string; is_active?: boolean }
    | undefined
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [city, setCity] = useState("")
  const [website, setWebsite] = useState("")
  const [proofLinks, setProofLinks] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [verificationDisclaimerAccepted, setVerificationDisclaimerAccepted] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setMessage("")

    const proofs = toValidHttpUrls(proofLinks)

    if (!companyName.trim() || !city.trim() || proofs.length === 0) {
      setMessage("Bitte Name, Stadt und mindestens einen gültigen Nachweis-Link ausfüllen.")
      return
    }
    if (contactEmail && !isValidEmail(contactEmail)) {
      setMessage("Bitte eine gültige Kontakt-E-Mail eingeben.")
      return
    }
    if (!privacyAccepted || !verificationDisclaimerAccepted) {
      setMessage("Bitte Datenschutz- und Verifizierungshinweise bestätigen.")
      return
    }

    setSending(true)
    const response = await authenticatedFetch("/api/providers/verification", {
      method: "POST",
      body: JSON.stringify({
        companyName: normalizeText(companyName, 120),
        contactEmail: contactEmail.trim().toLowerCase() || null,
        city: normalizeText(city, 80),
        website: normalizeText(website, 250) || null,
        proofLinks,
        privacyAccepted,
        verificationDisclaimerAccepted,
        consentVersion: LEGAL_CONSENT_VERSION,
      }),
    })
    setSending(false)

    if (!response.ok) {
      const responseBody = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null
      setMessage(responseBody?.error?.message ?? "Verifizierungsanfrage konnte gerade nicht gespeichert werden.")
      return
    }

    setCompanyName("")
    setContactEmail("")
    setCity("")
    setWebsite("")
    setProofLinks("")
    setPrivacyAccepted(false)
    setVerificationDisclaimerAccepted(false)
    setMessage("Anfrage eingereicht. Das Admin-Team prüft deine Nachweise.")
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-2xl p-8 sm:p-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {pageContent?.is_active === false
              ? "Anbieter-Verifizierung"
              : pageContent?.title || "Anbieter-Verifizierung"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {pageContent?.is_active === false
              ? "Reiche Nachweise ein, damit dein Anbieterprofil als verifiziert markiert werden kann."
              : pageContent?.subtitle ||
                "Reiche Nachweise ein, damit dein Anbieterprofil als verifiziert markiert werden kann."}
          </p>
          <div className="panel-muted mt-5 rounded-xl p-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Was &quot;verifiziert&quot; bei Hilfinio bedeutet
            </p>
            <p className="mt-2">
              Hilfinio prüft eingereichte Nachweise und Profilangaben nur im Rahmen eines
              Plausibilitäts- und Dokumentenchecks. Der Verifizierungsstatus ist keine
              Garantie für Qualität, Bonität, fortbestehende Berechtigung oder die
              rechtliche Zulässigkeit aller angebotenen Leistungen.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[10px] bg-white/70 p-3 dark:bg-slate-900/60">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Wir prüfen</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Profilangaben, Nachweislinks, Plausibilität und sichtbare Widersprüche.
                </p>
              </div>
              <div className="rounded-[10px] bg-white/70 p-3 dark:bg-slate-900/60">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Wir garantieren nicht</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Fachliche Leistung, Bonität, dauerhafte Berechtigung oder Vertragserfüllung.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <p className="panel-muted mt-5 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              {message}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              className="field-input min-h-12 rounded-xl px-4 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Firmenname oder Anbietername"
              aria-label="Firmenname oder Anbietername Pflichtfeld"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-xl px-4 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Kontakt-E-Mail"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-xl px-4 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Stadt"
              aria-label="Stadt Pflichtfeld"
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-xl px-4 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Webseite (optional)"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <textarea
              className="field-input min-h-28 rounded-xl px-4 py-3 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 sm:col-span-2"
              placeholder="Nachweis-Links (Fotos oder Dokumente), mehrere Zeilen oder Komma-getrennt"
              aria-label="Nachweis-Links Pflichtfeld"
              required
              value={proofLinks}
              onChange={(event) => setProofLinks(event.target.value)}
            />
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex items-start gap-3 rounded-[12px] border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                checked={privacyAccepted}
                onChange={(event) => setPrivacyAccepted(event.target.checked)}
              />
              <span>
                Ich habe die{" "}
                <Link
                  href="/datenschutz"
                  className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
                >
                  Datenschutzerklärung
                </Link>{" "}
                gelesen und bin mit der Verarbeitung meiner Angaben und Nachweise für das
                Verifizierungsverfahren einverstanden.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-[12px] border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                checked={verificationDisclaimerAccepted}
                onChange={(event) => setVerificationDisclaimerAccepted(event.target.checked)}
              />
              <span>
                Ich bestätige, dass meine Angaben richtig sind und dass ein
                Verifizierungsstatus keine Empfehlung oder Erfolgsgarantie von Hilfinio
                darstellt.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="mt-6 w-full rounded-xl bg-[var(--brand)] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sende..." : "Verifizierungsanfrage senden"}
          </button>
        </section>
      </div>
    </main>
  )
}
