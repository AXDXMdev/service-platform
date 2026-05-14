"use client"

import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { humanizeAuthError } from "@/lib/clientErrors"
import { supabase } from "@/lib/supabaseClient"
import { isValidEmail } from "@/lib/validation"

export default function ResetPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const resetPassword = async () => {
    if (!isValidEmail(email)) {
      setMessage(t("authInvalidEmail"))
      return
    }

    setSending(true)
    setMessage("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setSending(false)

    setMessage(error ? humanizeAuthError(error.message) : t("resetPasswordSuccess"))
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-md animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">{t("resetPasswordTitle")}</h1>

          {message && (
            <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {message}
            </p>
          )}

          <input
            placeholder={t("authEmailPlaceholder")}
            type="email"
            autoComplete="email"
            className="field-input mt-6 min-h-12 w-full rounded-[10px] px-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={resetPassword}
            disabled={sending}
          >
            {sending ? t("resetPasswordSending") : t("resetPasswordAction")}
          </button>
        </section>
      </div>
    </main>
  )
}
