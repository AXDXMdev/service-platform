"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { humanizeAuthCallbackError, humanizeAuthError } from "@/lib/clientErrors"
import { getAuthRedirectUrl, sanitizeAuthNextPath } from "@/lib/authRedirects"
import { supabase } from "@/lib/supabaseClient"
import {
  isLikelySpamTrapFilled,
  isStrongPassword,
  isValidEmail,
} from "@/lib/validation"

export default function Login() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return ""
    const callbackError = new URLSearchParams(window.location.search).get("error")
    return humanizeAuthCallbackError(callbackError)
  })
  const [websiteTrap, setWebsiteTrap] = useState("")

  const getSafeRedirectTarget = () => {
    const target = new URLSearchParams(window.location.search).get("redirect")
    return sanitizeAuthNextPath(target, "/dashboard")
  }

  const login = async () => {
    if (isLikelySpamTrapFilled(websiteTrap)) {
      setMessage(t("authUnavailable"))
      return
    }
    if (!isValidEmail(email)) {
      setMessage(t("authInvalidEmail"))
      return
    }

    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)

    if (error) {
      setMessage(humanizeAuthError(error.message))
      return
    }

    router.push(getSafeRedirectTarget())
  }

  const signUp = async () => {
    if (!isValidEmail(email) || !isStrongPassword(password)) {
      setMessage(t("authInvalidCredentials"))
      return
    }
    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/auth/callback?next=/dashboard"),
      },
    })
    setLoading(false)

    setMessage(error ? humanizeAuthError(error.message) : t("authCheckEmail"))
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-md animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">{t("authTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t("authSubtitle")}
          </p>

          {message && (
            <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {message}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={websiteTrap}
              onChange={(e) => setWebsiteTrap(e.target.value)}
            />
            <input
              id="login-email"
              className="field-input min-h-12 w-full rounded-[10px] px-4"
              placeholder={t("authEmailPlaceholder")}
              type="email"
              autoComplete="email"
              aria-label={t("authEmailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="login-password"
              className="field-input min-h-12 w-full rounded-[10px] px-4"
              type="password"
              placeholder={t("authPasswordPlaceholder")}
              autoComplete="current-password"
              aria-label={t("authPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={login}
            disabled={loading}
          >
            {loading ? t("authWait") : t("authLoginAction")}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
            <Link href="/reset-password" className="font-semibold text-[var(--brand)] hover:underline">
              {t("authForgotPassword")}
            </Link>
          </p>

          <button
            type="button"
            className="mt-3 w-full rounded-[10px] border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={signUp}
            disabled={loading}
          >
            {t("authRegisterAction")}
          </button>
        </section>
      </div>
    </main>
  )
}
