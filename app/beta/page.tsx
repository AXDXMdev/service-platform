"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, type FormEvent } from "react"

function BetaAccessForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const next = searchParams.get("next") || "/"

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/beta-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error?.message ?? "Zugang konnte nicht freigeschaltet werden.")
        return
      }

      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/")
      router.refresh()
    } catch {
      setMessage("Verbindung fehlgeschlagen. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label htmlFor="beta-code" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
        Zugangscode
      </label>
      <input
        id="beta-code"
        name="code"
        type="password"
        autoComplete="one-time-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className="field-input min-h-12 w-full rounded-[10px] px-4"
        placeholder="Code eingeben"
        aria-label="Zugangscode"
      />
      {message && (
        <p className="rounded-[8px] bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary min-h-12 w-full justify-center rounded-[10px] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Prüfe..." : "Hilfinio betreten"}
      </button>
    </form>
  )
}

export default function BetaPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 text-slate-950 dark:text-slate-100 sm:px-8">
      <section className="mx-auto flex min-h-[72vh] max-w-xl items-center">
        <div className="card-surface w-full rounded-[14px] p-7 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.45)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Closed Beta
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Hilfinio ist gerade nur für eingeladene Nutzer geöffnet.
          </h1>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            Wir starten bewusst kontrolliert in Stuttgart und Umgebung, damit Anbieterqualität,
            Antwortzeiten und echte Vermittlungen stimmen.
          </p>

          <Suspense fallback={<div className="mt-7 h-32 animate-pulse rounded-[10px] bg-slate-200 dark:bg-slate-800" />}>
            <BetaAccessForm />
          </Suspense>

          <div className="mt-6 rounded-[10px] bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Noch keinen Code?{" "}
            <Link href="/waitlist" className="font-semibold text-[var(--brand)] hover:underline">
              Trag dich auf die Warteliste ein.
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
