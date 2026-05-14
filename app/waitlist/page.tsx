"use client"

import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { readApiErrorMessage } from "@/lib/authenticatedApi"
import { useSiteSettings } from "@/components/SiteSettingsProvider"
import { LEGAL_CONSENT_VERSION } from "@/lib/legal"
import { pilotCityLabel } from "@/lib/pilotMode"
import { isValidEmail, normalizeText } from "@/lib/validation"

type WaitlistRole = "customer" | "provider" | "volunteer"

export default function WaitlistPage() {
  const { t } = useLanguage()
  const { content } = useSiteSettings()
  const pageContent = content["page:waitlist"] as
    | { title?: string; subtitle?: string; is_active?: boolean }
    | undefined
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [role, setRole] = useState<WaitlistRole>("customer")
  const [note, setNote] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingAccepted, setMarketingAccepted] = useState(false)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setStatus("")

    if (!name.trim() || !email.trim() || !city.trim()) {
      setStatus("Bitte Name, E-Mail und Stadt ausfuellen.")
      return
    }
    if (!isValidEmail(email)) {
      setStatus("Bitte eine gueltige E-Mail eingeben.")
      return
    }
    if (!privacyAccepted) {
      setStatus("Bitte den Datenschutzhinweis bestaetigen.")
      return
    }

    setSaving(true)
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: normalizeText(name, 120),
        email: email.trim().toLowerCase(),
        city: normalizeText(city, 80),
        role,
        note: normalizeText(note, 800) || null,
        privacyAccepted,
        marketingAccepted,
        consentVersion: LEGAL_CONSENT_VERSION,
      }),
    })
    setSaving(false)

    if (!response.ok) {
      setStatus(await readApiErrorMessage(response))
      return
    }

    setName("")
    setEmail("")
    setCity("")
    setRole("customer")
    setNote("")
    setPrivacyAccepted(false)
    setMarketingAccepted(false)
    setStatus(`${t("waitlistSuccess")} Wir melden uns, sobald Hilfinio in deiner Region startet.`)
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-2xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">
            {pageContent?.is_active === false ? t("waitlistTitle") : pageContent?.title || t("waitlistTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {pageContent?.is_active === false ? t("waitlistText") : pageContent?.subtitle || t("waitlistText")}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--brand)]">
            Pilot-Staedte: {pilotCityLabel()}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Wir nutzen deine Angaben fuer die regionale Launch-Planung und fuer eine
            einmalige oder wiederkehrende Information ueber den Start von Hilfinio in deiner
            Stadt. Freiwillige Marketing-E-Mails versenden wir nur bei separater Zustimmung.
          </p>

          {status && (
            <p className="panel-muted mt-4 rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              {status}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder={t("waitlistName")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder={t("waitlistEmail")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-[10px] px-4 sm:col-span-2"
              placeholder={t("waitlistCity")}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("waitlistRole")}
              </span>
              <select
                className="field-input min-h-12 w-full rounded-[10px] px-4"
                value={role}
                onChange={(event) => setRole(event.target.value as WaitlistRole)}
              >
                <option value="customer">{t("waitlistRoleCustomer")}</option>
                <option value="provider">{t("waitlistRoleProvider")}</option>
                <option value="volunteer">{t("waitlistRoleVolunteer")}</option>
              </select>
            </label>
            <textarea
              className="field-input min-h-24 rounded-[10px] px-4 py-3 sm:col-span-2"
              placeholder={t("waitlistMessage")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
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
                  Datenschutzerklaerung
                </Link>{" "}
                gelesen und bin mit der Verarbeitung meiner Angaben fuer die Warteliste
                einverstanden.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                checked={marketingAccepted}
                onChange={(event) => setMarketingAccepted(event.target.checked)}
              />
              <span>
                Ich moechte zusaetzlich Produktupdates und Marketing-E-Mails zu Hilfinio
                erhalten. Diese Einwilligung ist freiwillig und jederzeit widerrufbar.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Speichere..." : t("waitlistButton")}
          </button>
        </section>
      </div>
    </main>
  )
}
