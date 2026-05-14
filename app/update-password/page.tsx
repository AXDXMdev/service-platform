"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { humanizeAuthError } from "@/lib/clientErrors"
import { supabase } from "@/lib/supabaseClient"
import { isStrongPassword } from "@/lib/validation"

export default function UpdatePassword() {
  const { t } = useLanguage()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const updatePassword = async () => {
    if (!isStrongPassword(password)) {
      setMessage(t("authWeakPassword"))
      return
    }

    setSaving(true)
    setMessage("")
    const { error } = await supabase.auth.updateUser({
      password,
    })
    setSaving(false)

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
          <h1 className="text-3xl font-semibold">{t("updatePasswordTitle")}</h1>

          {message && (
            <p className="mt-4 rounded-[8px] bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {message}
            </p>
          )}

          <input
            type="password"
            placeholder={t("updatePasswordPlaceholder")}
            className="field-input mt-6 min-h-12 w-full rounded-[10px] px-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={updatePassword}
            disabled={saving}
          >
            {saving ? t("updatePasswordSaving") : t("updatePasswordAction")}
          </button>
        </section>
      </div>
    </main>
  )
}
