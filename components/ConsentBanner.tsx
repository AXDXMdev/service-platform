"use client"

import Link from "next/link"
import { useState } from "react"
import { readConsentSettings, writeConsentSettings } from "@/lib/consent"

export function hasMarketingConsent() {
  return readConsentSettings()?.marketing === true
}

export default function ConsentBanner({ enabled }: { enabled: boolean }) {
  const [dismissed, setDismissed] = useState(false)

  if (!enabled || dismissed || typeof window === "undefined" || readConsentSettings()) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Datenschutz-Einstellungen
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Wir verwenden technisch notwendige Speicherungen fuer Sprache, Barrierefreiheit und
          Darstellung. Marketing- und Werbeskripte werden erst geladen, wenn du zustimmst.
          Details findest du in der{" "}
          <Link
            href="/datenschutz"
            className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Datenschutzerklaerung
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              writeConsentSettings({ necessary: true, analytics: false, marketing: false })
              setDismissed(true)
            }}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Nur notwendige Technologien
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsentSettings({ necessary: true, analytics: false, marketing: true })
              setDismissed(true)
            }}
            className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            Marketing akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}
