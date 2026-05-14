"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ThemeMode = "system" | "light" | "dark"
type Theme = "light" | "dark"

type ThemeContextValue = {
  mode: ThemeMode
  theme: Theme
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light")
  const theme: Theme = mode === "system" ? getSystemTheme() : mode

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("hilfino-theme-mode")
      if (stored === "light" || stored === "dark") {
        setMode(stored)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (mode === "system") return
    window.localStorage.setItem("hilfino-theme-mode", mode)
  }, [mode])

  useEffect(() => {
    if (mode !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      document.documentElement.classList.toggle(
        "dark",
        mediaQuery.matches
      )
    }

    mediaQuery.addEventListener("change", onChange)

    return () => {
      mediaQuery.removeEventListener("change", onChange)
    }
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      setMode,
    }),
    [mode, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return context
}
