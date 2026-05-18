"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { humanizeAuthError } from "@/lib/clientErrors"
import { supabase } from "@/lib/supabaseClient"
import {
  isLikelySpamTrapFilled,
  isStrongPassword,
  isValidEmail,
} from "@/lib/validation"

export default function Register() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [websiteTrap, setWebsiteTrap] = useState("")

  const register = async () => {
    if (isLikelySpamTrapFilled(websiteTrap)) {
      setMessage(t("registerUnavailable"))
      return
    }
    if (!isValidEmail(email)) {
      setMessage(t("authInvalidEmail"))
      return
    }
    if (!isStrongPassword(password)) {
      setMessage(t("authWeakPassword"))
      return
    }

    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)

    if (error) {
      setMessage(humanizeAuthError(error.message))
      return
    }

    router.push("/login")
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-md animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">{t("registerTitle")}</h1>

          {message && (
            <p className="mt-4 rounded-[8px] bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
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
              id="register-email"
              className="field-input min-h-12 w-full rounded-[10px] px-4"
              placeholder={t("authEmailPlaceholder")}
              type="email"
              autoComplete="email"
              aria-label={t("authEmailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="register-password"
              className="field-input min-h-12 w-full rounded-[10px] px-4"
              type="password"
              placeholder={t("authPasswordPlaceholder")}
              autoComplete="new-password"
              aria-label={t("authPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={register}
            disabled={loading}
          >
            {loading ? t("authWait") : t("authRegisterAction")}
          </button>
        </section>
      </div>
    </main>
  )
}
