"use client"

import type { CSSProperties } from "react"
import type { PageContent, SiteSettings, ThemeSettings } from "@/lib/siteSettings"

type AdminPreviewModuleProps = {
  previewPageSlug: string
  previewMode: "desktop" | "mobile"
  pageContents: PageContent[]
  previewPage: PageContent | undefined
  themeSettings: ThemeSettings
  siteSettings: SiteSettings
  designPreviewStyle: CSSProperties
  onPreviewPageSlugChange: (slug: string) => void
  onPreviewModeChange: (mode: "desktop" | "mobile") => void
}

export function AdminPreviewModule({
  previewPageSlug,
  previewMode,
  pageContents,
  previewPage,
  themeSettings,
  siteSettings,
  designPreviewStyle,
  onPreviewPageSlugChange,
  onPreviewModeChange,
}: AdminPreviewModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Vorschau</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Live Preview für Design, Startseite und Page-Inhalte vor dem Speichern.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={previewPageSlug}
            onChange={(event) => onPreviewPageSlugChange(event.target.value)}
            className="field-input min-h-10 rounded-[10px] px-3 text-sm"
          >
            {pageContents.map((page) => (
              <option key={page.slug} value={page.slug}>
                {page.slug}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={
              previewMode === "desktop"
                ? "btn-primary px-3 py-2 text-sm font-semibold text-white"
                : "action-ghost"
            }
            onClick={() => onPreviewModeChange("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            className={
              previewMode === "mobile"
                ? "btn-primary px-3 py-2 text-sm font-semibold text-white"
                : "action-ghost"
            }
            onClick={() => onPreviewModeChange("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[12px] border border-[var(--border)] bg-slate-100 p-3 dark:bg-slate-950">
        <div
          className={`mx-auto overflow-hidden rounded-[12px] border shadow-sm transition-all ${
            previewMode === "mobile" ? "max-w-[390px]" : "max-w-5xl"
          }`}
          style={{
            ...designPreviewStyle,
            borderColor: themeSettings.card_background_color,
          }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{
              borderColor: themeSettings.text_muted_color,
              backgroundColor: themeSettings.card_background_color,
              color: themeSettings.card_text_color,
            }}
          >
            <div>
              <p className="text-lg font-bold">{themeSettings.text_logo || "Hilfinio"}</p>
              <p className="text-xs font-semibold" style={{ color: themeSettings.text_muted_color }}>
                Local Service Hub
              </p>
            </div>
            <span
              className="rounded-[8px] px-3 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: themeSettings.button_color }}
            >
              {siteSettings.hero_cta_find || "Dienstleister finden"}
            </span>
          </div>
          <div className="p-5">
            <p className="text-sm font-semibold" style={{ color: themeSettings.text_muted_color }}>
              {previewPage?.slug ?? "home"}
            </p>
            <h3 className="mt-2 text-2xl font-bold" style={{ color: themeSettings.text_color }}>
              {previewPageSlug === "home"
                ? siteSettings.hero_title || previewPage?.title || "Hilfinio"
                : previewPage?.title}
            </h3>
            <p className="mt-2 leading-7" style={{ color: themeSettings.text_secondary_color }}>
              {previewPageSlug === "home" ? siteSettings.hero_subheadline || previewPage?.subtitle : previewPage?.subtitle}
            </p>
            <div
              className="mt-4 rounded-[10px] border p-4"
              style={{
                backgroundColor: themeSettings.card_background_color,
                borderColor: themeSettings.text_muted_color,
                color: themeSettings.card_text_color,
              }}
            >
              <p className="font-semibold">Service-Karte</p>
              <p className="mt-1 text-sm" style={{ color: themeSettings.text_secondary_color }}>
                {previewPage?.content || "So wirken Karten, Texte, Inputs und CTAs zusammen."}
              </p>
              <button
                type="button"
                className="mt-3 rounded-[8px] px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: themeSettings.button_color }}
              >
                {siteSettings.hero_cta_offer || "Service anbieten"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
