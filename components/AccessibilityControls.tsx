"use client"

import { useState } from "react"
import { useAccessibility } from "@/components/AccessibilityProvider"
import { useLanguage } from "@/components/LanguageProvider"

type ToggleItem = {
  key: "easyLanguage" | "highContrast" | "largeText" | "reducedMotion"
  labelKey:
    | "a11yEasyLanguage"
    | "a11yHighContrast"
    | "a11yLargeText"
    | "a11yReducedMotion"
  hintKey:
    | "a11yEasyLanguageHint"
    | "a11yHighContrastHint"
    | "a11yLargeTextHint"
    | "a11yReducedMotionHint"
}

const ITEMS: ToggleItem[] = [
  {
    key: "easyLanguage",
    labelKey: "a11yEasyLanguage",
    hintKey: "a11yEasyLanguageHint",
  },
  {
    key: "highContrast",
    labelKey: "a11yHighContrast",
    hintKey: "a11yHighContrastHint",
  },
  {
    key: "largeText",
    labelKey: "a11yLargeText",
    hintKey: "a11yLargeTextHint",
  },
  {
    key: "reducedMotion",
    labelKey: "a11yReducedMotion",
    hintKey: "a11yReducedMotionHint",
  },
]

export default function AccessibilityControls() {
  const { t } = useLanguage()
  const settings = useAccessibility()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="btn-secondary min-h-10 px-3 py-2 text-sm font-semibold"
        aria-expanded={open}
        aria-label={t("navAccessibility")}
        title={t("navAccessibility")}
      >
        <span aria-hidden>AA</span>
        <span className="sr-only">{t("navAccessibility")}</span>
      </button>

      {open && (
        <div className="card-surface absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-[14px] p-3 shadow-xl">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("a11yTitle")}
          </p>
          <div className="space-y-2">
            {ITEMS.map((item) => (
              <label
                key={item.key}
                className="panel-muted flex cursor-pointer items-start justify-between gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:border-[var(--brand)]/40 hover:bg-white"
              >
                <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t(item.labelKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">
                    {t(item.hintKey)}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--brand)]"
                  checked={settings[item.key]}
                  onChange={(event) => settings.setSetting(item.key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
