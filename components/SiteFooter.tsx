"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"

export default function SiteFooter() {
  const { t } = useLanguage()
  const { content } = useSiteSettings()
  const footer = content.footer ?? {}
  const impressumLabel =
    typeof footer.impressum_label === "string" ? footer.impressum_label : t("footerImpressum")
  const datenschutzLabel =
    typeof footer.datenschutz_label === "string" ? footer.datenschutz_label : t("footerPrivacy")
  const agbLabel = typeof footer.agb_label === "string" ? footer.agb_label : t("footerTerms")
  const providerLabel =
    typeof footer.provider_verification_label === "string"
      ? footer.provider_verification_label
      : t("footerProviderVerification")
  const waitlistLabel =
    typeof footer.waitlist_label === "string" ? footer.waitlist_label : t("footerWaitlist")
  const footerText =
    typeof footer.footer_text === "string"
      ? footer.footer_text
      : t("footerText")

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/75 px-6 py-7 dark:border-slate-700 dark:bg-slate-900/60 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-700 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl leading-6">© {new Date().getFullYear()} Hilfinio · {footerText}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/impressum" className="font-semibold transition hover:text-[var(--brand)]">
            {impressumLabel}
          </Link>
          <Link href="/datenschutz" className="font-semibold transition hover:text-[var(--brand)]">
            {datenschutzLabel}
          </Link>
          <Link href="/agb" className="font-semibold transition hover:text-[var(--brand)]">
            {agbLabel}
          </Link>
          <Link
            href="/provider-verification"
            className="font-semibold transition hover:text-[var(--brand)]"
          >
            {providerLabel}
          </Link>
          <Link href="/waitlist" className="font-semibold transition hover:text-[var(--brand)]">
            {waitlistLabel}
          </Link>
          <Link href="/links" className="font-semibold transition hover:text-[var(--brand)]">
            Links
          </Link>
          <Link href="/cookie-einstellungen" className="font-semibold transition hover:text-[var(--brand)]">
            Cookie-Einstellungen
          </Link>
          <Link href="/plattform-beschwerden" className="font-semibold transition hover:text-[var(--brand)]">
            Beschwerden
          </Link>
        </div>
      </div>
    </footer>
  )
}
