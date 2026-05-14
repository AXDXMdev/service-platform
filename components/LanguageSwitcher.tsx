"use client"

import { localeNames, locales } from "@/app/i18n"
import { useLanguage } from "@/components/LanguageProvider"

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      className="panel-muted flex shrink-0 rounded-[10px] p-1"
      aria-label={t("languageLabel")}
    >
      {locales.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          title={localeNames[item]}
          className={`min-h-9 min-w-9 rounded-[8px] px-2 text-xs font-semibold uppercase transition-colors sm:min-w-10 ${
            locale === item
              ? "bg-[var(--brand)] text-white shadow-sm"
              : "text-slate-700 hover:bg-white hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
