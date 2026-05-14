"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/components/LanguageProvider"

export default function AuthButton() {
  const { t } = useLanguage()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setLoggedIn(Boolean(data.session))
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setLoggedIn(Boolean(session))
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (loggedIn === null) {
    return (
      <span
        className="btn-secondary min-h-10 w-20 animate-pulse px-3 py-2 sm:w-24"
        aria-hidden
      />
    )
  }

  if (loggedIn) {
    return (
      <button
        type="button"
        className="btn-secondary min-h-10 px-3 py-2 text-sm font-semibold sm:px-4"
        onClick={logout}
        disabled={loggingOut}
      >
        {loggingOut ? "..." : t("logout")}
      </button>
    )
  }

  return (
    <Link
      className="btn-primary min-h-10 px-3 py-2 text-sm font-semibold text-white sm:px-4"
      href="/login"
    >
      {t("login")}
    </Link>
  )
}
