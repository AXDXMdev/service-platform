"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type AccessibilitySettings = {
  easyLanguage: boolean
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
}

type AccessibilityContextValue = AccessibilitySettings & {
  setSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void
}

const STORAGE_KEY = "hilfino-accessibility"

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    easyLanguage: false,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
  })

  useEffect(() => {
    let cancelled = false
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>
      const frame = window.requestAnimationFrame(() => {
        if (cancelled) return
        setSettings({
          easyLanguage: Boolean(parsed.easyLanguage),
          highContrast: Boolean(parsed.highContrast),
          largeText: Boolean(parsed.largeText),
          reducedMotion: Boolean(parsed.reducedMotion),
        })
      })
      return () => {
        cancelled = true
        window.cancelAnimationFrame(frame)
      }
    } catch {
      // keep defaults
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("a11y-high-contrast", settings.highContrast)
    root.classList.toggle("a11y-large-text", settings.largeText)
    root.classList.toggle("a11y-reduced-motion", settings.reducedMotion)
  }, [settings.highContrast, settings.largeText, settings.reducedMotion])

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...settings,
      setSetting: (key, value) => {
        setSettings((current) => ({ ...current, [key]: value }))
      },
    }),
    [settings]
  )

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)

  if (!context) {
    throw new Error("useAccessibility must be used inside AccessibilityProvider")
  }

  return context
}
