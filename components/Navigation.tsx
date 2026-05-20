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
    <nav className="nav-surface sticky top-0 z-40 px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-3">
        <Link
          href="/"
          className="min-w-0 flex-1 rounded-[12px] px-1.5 py-1.5 leading-none transition hover:bg-[var(--brand-soft-strong)] md:flex-none md:px-2"
          aria-label={t("brand")}
        >
          <span className="flex min-w-0 items-center gap-2.5 md:gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-white ring-1 ring-[var(--surface-border)] shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)] md:h-11 md:w-11 md:rounded-[12px]">
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
              <span className="brand-word block truncate text-xl font-extrabold leading-none md:text-2xl">
                {brandName.toUpperCase()}
              </span>
              <span className="brand-subtitle mt-1 block truncate text-[9px] font-bold uppercase leading-tight sm:text-[10px]">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <AccessibilityControls />
          <ThemeToggle />
          <LanguageSwitcher />
          <NotificationBell />
          <AuthButton />
        </div>
      </div>
      <div className="no-scrollbar mx-auto mt-2 w-full max-w-7xl overflow-x-auto overscroll-x-contain pb-1 lg:hidden">
        <div className="flex w-max min-w-full gap-2">
          <Link className={navLinkClass("/services")} href="/services">{t("navServices")}</Link>
          <Link className={navLinkClass("/create-service", true)} href="/create-service">{t("navCreate")}</Link>
          <Link className={navLinkClass("/dashboard")} href="/dashboard">{t("navDashboard")}</Link>
          <Link className={navLinkClass("/my-requests")} href="/my-requests">{t("navRequests")}</Link>
          <Link className={navLinkClass("/favorites")} href="/favorites">{t("navFavorites")}</Link>
        </div>
      </div>
    </nav>
  )
}
