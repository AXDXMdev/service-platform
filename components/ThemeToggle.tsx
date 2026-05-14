"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { useTheme } from "@/components/ThemeProvider"

export default function ThemeToggle() {
  const { t } = useLanguage()
  const { theme, setMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const darkMode = theme === "dark"

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={false}
        aria-label={t("themeLight")}
        className="panel-muted relative flex h-10 w-16 items-center rounded-full"
      >
        <span className="sr-only">{t("themeSwitch")}</span>
        <span className="pointer-events-none absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-amber-500 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label={darkMode ? t("themeDark") : t("themeLight")}
      onClick={() => setMode(darkMode ? "light" : "dark")}
      className={`panel-muted relative flex h-10 w-16 items-center rounded-full transition-colors ${
        darkMode
          ? "bg-[#d6eaff]"
          : "bg-white"
      }`}
    >
      <span className="sr-only">{t("themeSwitch")}</span>
      <span
        className={`pointer-events-none absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition ${
          darkMode
            ? "translate-x-7 bg-[var(--brand)] text-white"
            : "translate-x-0 bg-white text-amber-500"
        }`}
      >
        {darkMode ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12.2 2.7a1 1 0 0 0-1.3 1.1 8.2 8.2 0 1 1-7.1 7.1 1 1 0 0 0-1.1-1.3A10.2 10.2 0 1 0 12.2 2.7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  )
}
