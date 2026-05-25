"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AuthButton from "@/components/AuthButton"
import AccessibilityControls from "@/components/AccessibilityControls"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import ThemeToggle from "@/components/ThemeToggle"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"

const NotificationBell = dynamic(() => import("@/components/NotificationBell"), {
  ssr: false,
  loading: () => null,
})

export default function Navigation() {
  const { t } = useLanguage()
  const { theme } = useSiteSettings()
  const pathname = usePathname()
  const brandName = theme.text_logo || "Hilfinio"
  const navLinkClass = (href: string, primary = false) => {
    const isActive = href === "/" ? pathname === href : pathname.startsWith(href)
    return [
      "nav-link",
      primary ? "nav-link-primary" : "",
      isActive && !primary ? "nav-link-active" : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <nav className="nav-surface sticky top-0 z-40 px-3 py-2 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 md:gap-3">
        <Link
          href="/"
          className="min-w-0 flex-1 rounded-[12px] px-1 py-1 leading-none transition hover:bg-[var(--brand-soft-strong)] sm:px-2 md:flex-none"
          aria-label={t("brand")}
        >
          <span className="flex min-w-0 items-center gap-2 sm:gap-2.5 md:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white ring-1 ring-[var(--surface-border)] shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)] sm:h-10 sm:w-10 md:h-11 md:w-11 md:rounded-[12px]">
              <Image
                src="/hilfino-mark.png"
                alt=""
                width={96}
                height={96}
                priority
                sizes="44px"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="brand-word block truncate text-lg font-extrabold leading-none sm:text-xl md:text-2xl">
                {brandName.toUpperCase()}
              </span>
              <span className="brand-subtitle mt-1 hidden truncate text-[9px] font-bold uppercase leading-tight sm:block sm:text-[10px]">
                <span className="text-blue-600 dark:text-blue-300">{t("brandTaglineFind")}</span>{" "}
                <span className="text-emerald-500 dark:text-emerald-300">{t("brandTaglineGive")}</span>{" "}
                <span className="text-slate-800 dark:text-slate-200">{t("brandTaglineTogether")}</span>
              </span>
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <Link className={navLinkClass("/services")} href="/services">{t("navServices")}</Link>
          <Link className={navLinkClass("/apps")} href="/apps">{t("navApps")}</Link>
          <Link className={navLinkClass("/dashboard")} href="/dashboard">{t("navDashboard")}</Link>
          <Link className={navLinkClass("/my-requests")} href="/my-requests">{t("navRequests")}</Link>
          <Link className={navLinkClass("/create-service", true)} href="/create-service">{t("navCreate")}</Link>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2">
          <NotificationBell />
          <details className="nav-preferences relative">
            <summary className="btn-secondary flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M19 13.2v-2.4l-2.05-.38a5.6 5.6 0 0 0-.65-1.55l1.18-1.72-1.7-1.7-1.72 1.18a5.6 5.6 0 0 0-1.55-.65L12.13 4h-2.4l-.38 2.05c-.56.15-1.08.37-1.55.65L6.08 5.52l-1.7 1.7 1.18 1.72c-.28.47-.5.99-.65 1.55L2.86 10.87v2.4l2.05.38c.15.56.37 1.08.65 1.55l-1.18 1.72 1.7 1.7 1.72-1.18c.47.28.99.5 1.55.65l.38 2.05h2.4l.38-2.05c.56-.15 1.08-.37 1.55-.65l1.72 1.18 1.7-1.7-1.18-1.72c.28-.47.5-.99.65-1.55L19 13.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <span className="hidden xl:inline">{t("navPreferences")}</span>
              <span className="sr-only">{t("navPreferences")}</span>
            </summary>
            <div className="card-surface absolute right-0 z-50 mt-2 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-[14px] p-3 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("languageLabel")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("themeSwitch")}
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("navAccessibility")}
                </span>
                <AccessibilityControls />
              </div>
            </div>
          </details>
          <AuthButton />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
          <NotificationBell />
          <details className="nav-preferences relative">
            <summary className="btn-secondary flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M19 13.2v-2.4l-2.05-.38a5.6 5.6 0 0 0-.65-1.55l1.18-1.72-1.7-1.7-1.72 1.18a5.6 5.6 0 0 0-1.55-.65L12.13 4h-2.4l-.38 2.05c-.56.15-1.08.37-1.55.65L6.08 5.52l-1.7 1.7 1.18 1.72c-.28.47-.5.99-.65 1.55L2.86 10.87v2.4l2.05.38c.15.56.37 1.08.65 1.55l-1.18 1.72 1.7 1.7 1.72-1.18c.47.28.99.5 1.55.65l.38 2.05h2.4l.38-2.05c.56-.15 1.08-.37 1.55-.65l1.72 1.18 1.7-1.7-1.18-1.72c.28-.47.5-.99.65-1.55L19 13.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">{t("navPreferences")}</span>
            </summary>
            <div className="card-surface absolute right-0 z-50 mt-2 flex w-[min(21rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-[14px] p-3 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("languageLabel")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("themeSwitch")}
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("navAccessibility")}
                </span>
                <AccessibilityControls />
              </div>
            </div>
          </details>
          <AuthButton />
        </div>
      </div>
      <div className="mx-auto mt-2 w-full max-w-7xl lg:hidden">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:w-max sm:min-w-full">
          <Link className={navLinkClass("/services")} href="/services">{t("navServices")}</Link>
          <Link className={navLinkClass("/create-service", true)} href="/create-service">{t("navCreate")}</Link>
          <Link className={navLinkClass("/dashboard")} href="/dashboard">{t("navDashboard")}</Link>
          <Link className={`${navLinkClass("/my-requests")} hidden sm:inline-flex`} href="/my-requests">{t("navRequests")}</Link>
          <Link className={`${navLinkClass("/favorites")} hidden sm:inline-flex`} href="/favorites">{t("navFavorites")}</Link>
        </div>
      </div>
    </nav>
  )
}
