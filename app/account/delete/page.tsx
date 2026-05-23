"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/authenticatedApi"
import { supabase } from "@/lib/supabaseClient"

export default function AccountDeletePage() {
  const router = useRouter()
  const [confirmationText, setConfirmationText] = useState("")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState<null | "request" | "delete">(null)

  const submit = async (mode: "request" | "delete_now") => {
    setStatus("")
    setLoading(mode === "request" ? "request" : "delete")

    const response = await authenticatedFetch("/api/account/delete", {
      method: "POST",
      body: JSON.stringify({
        mode,
        confirmationText,
        reason,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; data?: { message?: string }; error?: { message?: string } }
      | null

    setLoading(null)

    if (!response.ok) {
      setStatus(payload?.error?.message ?? "Kontolöschung konnte nicht verarbeitet werden.")
      return
    }

    setStatus(payload?.data?.message ?? "Anfrage gespeichert.")

    if (mode === "delete_now") {
      await supabase.auth.signOut()
      router.replace("/")
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl animate-float-up">
        <section className="card-surface rounded-[14px] border border-rose-200 p-7 dark:border-rose-900/60">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
            Konto löschen
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Dieser Schritt ist ernst. Je nach Datenlage kann Hilfinio dein Konto direkt
            entfernen oder zunächst einen Löschungsantrag zur manuellen Prüfung speichern.
          </p>

          {status ? (
            <p className="panel-muted mt-4 rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              {status}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Optionaler Grund
              </label>
              <textarea
                className="field-input min-h-28 w-full rounded-[10px] px-4 py-3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Zum Beispiel: Ich nutze den Dienst nicht mehr."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Bestätigung
              </label>
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                Gib zur Bestätigung exakt <span className="font-semibold">LOESCHEN</span> ein
                (technischer Bestätigungscode ohne Umlaut).
              </p>
              <input
                className="field-input min-h-12 w-full rounded-[10px] px-4"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="LOESCHEN"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => submit("request")}
              disabled={loading !== null}
              className="rounded-[10px] border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {loading === "request" ? "Sende Antrag..." : "Löschung beantragen"}
            </button>
            <button
              type="button"
              onClick={() => submit("delete_now")}
              disabled={loading !== null}
              className="rounded-[10px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading === "delete" ? "Lösche Konto..." : "Konto direkt löschen"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
