"use client"

import { useMemo, useState } from "react"
import { defaultConsentSettings, readConsentSettings, writeConsentSettings } from "@/lib/consent"

export default function CookieSettingsPage() {
  const initialConsent = useMemo(
    () =>
      typeof window === "undefined"
        ? defaultConsentSettings()
        : readConsentSettings() ?? defaultConsentSettings(),
    []
  )
  const [analytics, setAnalytics] = useState(initialConsent.analytics)
  const [marketing, setMarketing] = useState(initialConsent.marketing)
  const [status, setStatus] = useState("")

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
            Cookie- und Consent-Einstellungen
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Hier kannst du deine Einwilligungen für optionale Technologien jederzeit ändern
            oder widerrufen. Notwendige Speicherungen für Login, Sprache, Darstellung und
            Barrierefreiheit bleiben aktiv.
          </p>

          {status ? (
            <p role="status" className="panel-muted mt-4 rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              {status}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <div className="rounded-[12px] border border-slate-200 p-4 dark:border-slate-700">
              <p className="font-semibold text-slate-950 dark:text-slate-100">
                Notwendige Technologien
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Immer aktiv. Dazu gehören Sitzungsfunktionen, Sicherheitsmechanismen und
                lokale Einstellungen für Theme, Sprache und Barrierefreiheit.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-[12px] border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
              <span>
                <span className="block font-semibold text-slate-950 dark:text-slate-100">
                  Analytics
                </span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                  Optional. Aktuell vorbereitet, aber nur mit deiner Einwilligung erlaubt.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[12px] border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
              />
              <span>
                <span className="block font-semibold text-slate-950 dark:text-slate-100">
                  Marketing und Werbung
                </span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                  Optional. Dazu zählen insbesondere Werbeskripte wie Google AdSense.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                writeConsentSettings({ necessary: true, analytics, marketing })
                setStatus("Deine Einstellungen wurden gespeichert.")
              }}
              className="btn-primary min-h-12 justify-center px-4 py-3 font-semibold text-white"
            >
              Einstellungen speichern
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalytics(false)
                setMarketing(false)
                writeConsentSettings({ necessary: true, analytics: false, marketing: false })
                setStatus("Optionale Technologien wurden deaktiviert.")
              }}
              className="btn-secondary min-h-12 justify-center px-4 py-3 font-semibold"
            >
              Optionale ablehnen
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalytics(true)
                setMarketing(true)
                writeConsentSettings({ necessary: true, analytics: true, marketing: true })
                setStatus("Optionale Technologien wurden aktiviert.")
              }}
              className="btn-secondary min-h-12 justify-center px-4 py-3 font-semibold"
            >
              Optionale akzeptieren
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
