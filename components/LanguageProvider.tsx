"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  easyGermanTranslations,
  locales,
  translations,
  type Locale,
  type TranslationKey,
} from "@/app/i18n"
import { useAccessibility } from "@/components/AccessibilityProvider"

type TranslationOverrides = Partial<Record<TranslationKey, string>>
type TranslationOverrideMap = Partial<Record<Locale, TranslationOverrides>>

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
  overrides: TranslationOverrideMap
  setOverride: (locale: Locale, key: TranslationKey, value: string) => void
  resetOverrides: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { easyLanguage } = useAccessibility()
  const [locale, setLocaleState] = useState<Locale>("de")
  const [overrides, setOverrides] = useState<TranslationOverrideMap>({})

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedLocale = window.localStorage.getItem("hilfino-locale")
      if (storedLocale && locales.includes(storedLocale as Locale)) {
        setLocaleState(storedLocale as Locale)
      } else {
        const browserLocale = window.navigator.language.slice(0, 2)
        if (locales.includes(browserLocale as Locale)) {
          setLocaleState(browserLocale as Locale)
        }
      }

      try {
        const raw = window.localStorage.getItem("hilfino-copy-overrides")
        if (!raw) return
        setOverrides(JSON.parse(raw) as TranslationOverrideMap)
      } catch {
        // keep defaults
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem("hilfino-locale", locale)
  }, [locale])

  useEffect(() => {
    window.localStorage.setItem(
      "hilfino-copy-overrides",
      JSON.stringify(overrides)
    )
  }, [overrides])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key) =>
        overrides[locale]?.[key] ||
        (locale === "de" && easyLanguage ? easyGermanTranslations[key] : undefined) ||
        translations[locale][key] ||
        overrides.en?.[key] ||
        translations.en[key] ||
        key,
      overrides,
      setOverride: (targetLocale, key, value) => {
        setOverrides((current) => ({
          ...current,
          [targetLocale]: {
            ...(current[targetLocale] ?? {}),
            [key]: value,
          },
        }))
      },
      resetOverrides: () => {
        setOverrides({})
      },
    }),
    [easyLanguage, locale, overrides]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }

  return context
}
