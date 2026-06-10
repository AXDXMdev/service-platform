"use client"

import { useRouter } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { authenticatedFetch, readApiErrorMessage } from "@/lib/authenticatedApi"
import { humanizeAuthError } from "@/lib/clientErrors"
import { supabase } from "@/lib/supabaseClient"

type Role = "admin" | "moderator" | "provider" | "customer"
type ApiErrorPayload = { error?: { message?: string } }

function apiErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return payload.error?.message ?? fallback
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/admin/session", { method: "GET", credentials: "same-origin" })
        if (cancelled) return
        if (res.ok) {
          router.replace("/admin")
          router.refresh()
          return
        }

        if (res.status === 503) {
          try {
            const payload = (await res.json()) as ApiErrorPayload
            const nextMessage = apiErrorMessage(payload, "")
            if (!cancelled && nextMessage) setMessage(nextMessage)
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore auto-check failures; user can still submit.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setLoading(true)
    setMessage("Login wird geprüft...")

    const formData = event?.currentTarget ? new FormData(event.currentTarget) : null
    const submittedEmail = String(formData?.get("email") ?? email)
    const submittedPassword = String(formData?.get("password") ?? password)
    const submittedAdminKey = String(formData?.get("adminKey") ?? adminKey)
    const normalizedEmail = submittedEmail.trim().toLowerCase()
    const normalizedKey = submittedAdminKey.trim()

    if (!normalizedEmail || !submittedPassword || !normalizedKey) {
      setLoading(false)
      setMessage("Bitte E-Mail, Passwort und Admin-Schlüssel ausfüllen.")
      return
    }

    let auth: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
    try {
      auth = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: submittedPassword,
      })
    } catch {
      setLoading(false)
      setMessage("Supabase-Login ist gerade nicht erreichbar. Bitte Verbindung und Supabase-ENV prüfen.")
      return
    }

    if (auth.error || !auth.data.user) {
      setLoading(false)
      setMessage(humanizeAuthError(auth.error?.message ?? ""))
      return
    }

    setMessage("Supabase-Login erfolgreich. Admin-Schlüssel wird geprüft...")

    let response: Response
    try {
      response = await fetch("/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ password: normalizedKey }),
      })
    } catch {
      setLoading(false)
      await supabase.auth.signOut()
      setMessage("Server aktuell nicht erreichbar. Bitte später erneut versuchen.")
      return
    }

    let payload: ApiErrorPayload = {}
    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = {}
    }

    if (!response.ok) {
      setLoading(false)
      await supabase.auth.signOut()
      setMessage(apiErrorMessage(payload, "Falscher Admin-Schlüssel."))
      return
    }

    setMessage("Admin-Schlüssel korrekt. Rolle wird geprüft...")

    let roleResponse: Response
    try {
      roleResponse = await authenticatedFetch("/admin/role", {
        method: "GET",
        cache: "no-store",
      })
    } catch {
      setLoading(false)
      await fetch("/admin/session", { method: "DELETE", credentials: "same-origin" })
      await supabase.auth.signOut()
      setMessage("Rollencheck nicht erreichbar. Bitte Supabase-Session und Netzwerk prüfen.")
      return
    }

    if (!roleResponse.ok) {
      setLoading(false)
      await fetch("/admin/session", { method: "DELETE", credentials: "same-origin" })
      await supabase.auth.signOut()
      const roleMessage =
        roleResponse.status === 401
          ? "Die Supabase-Session konnte für den Rollencheck nicht gelesen werden. Bitte erneut anmelden."
          : roleResponse.status === 503
            ? "Der Admin-Rollencheck ist serverseitig nicht vollständig konfiguriert. Bitte Supabase-ENV prüfen."
            : await readApiErrorMessage(roleResponse)
      setMessage(roleMessage)
      return
    }

    const rolePayload = (await roleResponse.json()) as { data?: { role?: Role | null } }
    const role = (rolePayload.data?.role ?? null) as Role | null
    if (!role) {
      setLoading(false)
      await fetch("/admin/session", { method: "DELETE", credentials: "same-origin" })
      await supabase.auth.signOut()
      setMessage("Für dieses Konto ist keine Admin-/Moderator-Rolle in Supabase hinterlegt.")
      return
    }

    if (!["admin", "moderator"].includes(role)) {
      setLoading(false)
      await fetch("/admin/session", { method: "DELETE", credentials: "same-origin" })
      await supabase.auth.signOut()
      setMessage("Dieses Konto ist angemeldet, aber nicht als Admin oder Moderator freigeschaltet.")
      return
    }

    setLoading(false)
    setMessage("Login erfolgreich. Admin wird geöffnet...")
    router.replace("/admin")
    router.refresh()
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-md animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Melde dich mit deinem Supabase-Konto und dem serverseitigen Admin-Schlüssel an.
          </p>

          {message && (
            <p className="mt-4 rounded-[8px] bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {message}
            </p>
          )}

          <form onSubmit={submit}>
            <label htmlFor="admin-email" className="mt-6 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Admin E-Mail
              <input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input mt-2 min-h-12 w-full rounded-[10px] px-4"
                placeholder="admin@hilfinio.de"
                autoComplete="email"
              />
            </label>

            <label htmlFor="admin-password" className="mt-3 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Account Passwort
              <input
                id="admin-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input mt-2 min-h-12 w-full rounded-[10px] px-4"
                placeholder="Supabase Auth Passwort"
                autoComplete="current-password"
              />
            </label>

            <label htmlFor="admin-key" className="mt-3 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Admin-Schlüssel
              <input
                id="admin-key"
                name="adminKey"
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                className="field-input mt-2 min-h-12 w-full rounded-[10px] px-4"
                placeholder="Serverseitiger Admin-Schlüssel"
                autoComplete="off"
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                Das ist der in Vercel gesetzte Admin-Schlüssel, nicht dein Supabase-Passwort.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Prüfe..." : "Als Admin einloggen"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
