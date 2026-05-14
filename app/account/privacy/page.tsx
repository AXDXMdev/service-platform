"use client"

import Link from "next/link"
import { useState } from "react"
import { authenticatedFetch } from "@/lib/authenticatedApi"

export default function AccountPrivacyPage() {
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState<null | "export">(null)

  const exportData = async () => {
    setStatus("")
    setLoading("export")
    const response = await authenticatedFetch("/api/account/export")
    setLoading(null)

    if (!response.ok) {
      setStatus("Datenexport konnte gerade nicht erstellt werden.")
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "hilfinio-datenexport.json"
    anchor.click()
    window.URL.revokeObjectURL(url)
    setStatus("Dein Datenexport wurde heruntergeladen.")
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
            Datenschutz und Kontorechte
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Hier kannst du deine Consent-Einstellungen aendern, deine Daten exportieren oder
            dein Konto loeschen lassen.
          </p>

          {status ? (
            <p className="panel-muted mt-4 rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              {status}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[14px] border border-slate-200 p-5 dark:border-slate-700">
              <h2 className="font-semibold text-slate-950 dark:text-slate-100">Datenexport</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Lade deine gespeicherten personenbezogenen Daten als JSON herunter.
              </p>
              <button
                type="button"
                onClick={exportData}
                disabled={loading === "export"}
                className="mt-4 rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "export" ? "Erstelle Export..." : "Daten exportieren"}
              </button>
            </div>

            <div className="rounded-[14px] border border-slate-200 p-5 dark:border-slate-700">
              <h2 className="font-semibold text-slate-950 dark:text-slate-100">Cookie-Einstellungen</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Aendere jederzeit deine Einwilligungen fuer Analytics und Marketing.
              </p>
              <Link
                href="/cookie-einstellungen"
                className="mt-4 inline-flex rounded-[10px] border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Einstellungen oeffnen
              </Link>
            </div>

            <div className="rounded-[14px] border border-rose-200 p-5 dark:border-rose-900/60">
              <h2 className="font-semibold text-slate-950 dark:text-slate-100">Konto loeschen</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Beantrage die Loeschung deines Kontos oder loese sie direkt aus.
              </p>
              <Link
                href="/account/delete"
                className="mt-4 inline-flex rounded-[10px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Loeschung verwalten
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
