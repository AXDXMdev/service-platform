"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getCached, setCached } from "@/lib/clientCache"
import {
  defaultPageContents,
  defaultSiteSettings,
  defaultThemeSettings,
  type HomepageSection,
  type SiteSettings,
  type ThemeSettings,
} from "@/lib/siteSettings"

type SiteSettingsContextValue = {
  loading: boolean
  theme: ThemeSettings
  site: SiteSettings
  sections: HomepageSection[]
  content: Record<string, Record<string, unknown>>
  refresh: () => Promise<void>
}

type SiteSettingsApiResponse = {
  ok: boolean
  data?: {
    theme?: ThemeSettings
    site?: SiteSettings
    sections?: HomepageSection[]
    content?: Record<string, Record<string, unknown>>
  }
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null)

function buildDefaultContentMap() {
  return Object.fromEntries(
    defaultPageContents.map((page) => [
      `page:${page.slug}`,
      {
        ...page,
      } as Record<string, unknown>,
    ])
  )
}

function isReadableTextColor(color: string | null | undefined) {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color.trim())) return false
  const hex = color.trim().slice(1)
  const channels = [0, 2, 4].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  return luminance < 0.56
}

function safeTheme(theme: ThemeSettings) {
  return {
    ...theme,
    text_color: isReadableTextColor(theme.text_color) ? theme.text_color : defaultThemeSettings.text_color,
    text_secondary_color: isReadableTextColor(theme.text_secondary_color)
      ? theme.text_secondary_color
      : defaultThemeSettings.text_secondary_color,
    text_muted_color: isReadableTextColor(theme.text_muted_color)
      ? theme.text_muted_color
      : defaultThemeSettings.text_muted_color,
    card_text_color: isReadableTextColor(theme.card_text_color)
      ? theme.card_text_color
      : defaultThemeSettings.card_text_color,
  }
}

function applyThemeVariables(theme: ThemeSettings) {
  const readableTheme = safeTheme(theme)
  const isDark = document.documentElement.classList.contains("dark")
  const root = document.documentElement
  root.style.setProperty("--brand", readableTheme.primary_color)
  root.style.setProperty("--brand-strong", readableTheme.secondary_color)
  root.style.setProperty("--button-bg", readableTheme.button_color)
  root.style.setProperty("--background", isDark ? "#0b1220" : readableTheme.background_color)
  root.style.setProperty("--foreground", isDark ? "#f8fafc" : readableTheme.text_color)
  root.style.setProperty("--text-secondary", isDark ? "#d5deea" : readableTheme.text_secondary_color)
  root.style.setProperty("--text-muted", isDark ? "#a8b5c7" : readableTheme.text_muted_color)
  root.style.setProperty("--card", isDark ? "#111c2d" : readableTheme.card_background_color)
  root.style.setProperty("--card-foreground", isDark ? "#f8fafc" : readableTheme.card_text_color)
  root.style.setProperty("--surface", isDark ? "#111c2d" : readableTheme.card_background_color)
  root.style.setProperty("--surface-muted", isDark ? "#16243a" : "#f1f4ff")
  root.style.setProperty("--surface-border", isDark ? "#32435d" : "#d8def1")
  root.style.setProperty("--border", isDark ? "#32435d" : "#d8def1")
  root.style.setProperty("--input-bg", isDark ? "#0f1a2a" : readableTheme.card_background_color)
  root.style.setProperty("--input-text", isDark ? "#f8fafc" : readableTheme.text_color)
  root.style.setProperty("--radius-md", `${Math.max(0, Math.min(30, readableTheme.border_radius))}px`)
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings)
  const [site, setSite] = useState<SiteSettings>(defaultSiteSettings)
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [content, setContent] = useState<Record<string, Record<string, unknown>>>(buildDefaultContentMap)

  const refresh = async () => {
    const cachedTheme = getCached<ThemeSettings>("hilfino:cms:theme")
    const cachedSite = getCached<SiteSettings>("hilfino:cms:site")
    const cachedSections = getCached<HomepageSection[]>("hilfino:cms:sections")
    const cachedContent = getCached<Record<string, Record<string, unknown>>>("hilfino:cms:content")

    if (cachedTheme) setTheme(cachedTheme)
    if (cachedSite) setSite(cachedSite)
    if (cachedSections) setSections(cachedSections)
    if (cachedContent) setContent(cachedContent)
    if (cachedTheme && cachedSite && cachedSections && cachedContent) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/site-settings", {
        cache: "no-store",
      })
      const payload = (await response.json()) as SiteSettingsApiResponse

      if (response.ok && payload.ok) {
        const nextTheme = { ...defaultThemeSettings, ...(payload.data?.theme ?? {}) }
        const nextSite = { ...defaultSiteSettings, ...(payload.data?.site ?? {}) }
        const nextSections = payload.data?.sections ?? []
        const nextContent = payload.data?.content ?? {}

        setTheme(nextTheme)
        setSite(nextSite)
        setSections(nextSections)
        setContent(nextContent)
        setCached("hilfino:cms:theme", nextTheme, 30_000)
        setCached("hilfino:cms:site", nextSite, 30_000)
        setCached("hilfino:cms:sections", nextSections, 30_000)
        setCached("hilfino:cms:content", nextContent, 30_000)
        setLoading(false)
        return
      }
    } catch {
      // Keep cached/default values when the settings API is temporarily unavailable.
    }
    setLoading(false)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void refresh()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    applyThemeVariables(theme)
    const observer = new MutationObserver(() => applyThemeVariables(theme))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [theme])

  useEffect(() => {
    if (!site.default_theme_mode) return
    if (window.localStorage.getItem("hilfino-theme-mode")) return
    window.localStorage.setItem("hilfino-theme-mode", site.default_theme_mode)
  }, [site.default_theme_mode])

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      loading,
      theme,
      site,
      sections,
      content,
      refresh,
    }),
    [content, loading, sections, site, theme]
  )

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider")
  }
  return context
}
