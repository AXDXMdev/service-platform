"use client"

import { normalizeText } from "@/lib/validation"
import type { SiteSettings, ThemeSettings } from "@/lib/siteSettings"

type AdminDesignModuleProps = {
  canEdit: boolean
  themeSettings: ThemeSettings
  defaultThemeMode: SiteSettings["default_theme_mode"]
  onThemePatch: (patch: Partial<ThemeSettings>) => void
  onDefaultThemeModeChange: (mode: SiteSettings["default_theme_mode"]) => void
  onUploadLogo: (file: File) => Promise<void>
  onUploadHero: (file: File) => Promise<void>
  onSave: () => Promise<void>
  onReset: () => void
}

export function AdminDesignModule({
  canEdit,
  themeSettings,
  defaultThemeMode,
  onThemePatch,
  onDefaultThemeModeChange,
  onUploadLogo,
  onUploadHero,
  onSave,
  onReset,
}: AdminDesignModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Design bearbeiten</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold">
          Primärfarbe
          <input
            type="color"
            value={themeSettings.primary_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ primary_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Sekundärfarbe
          <input
            type="color"
            value={themeSettings.secondary_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ secondary_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Hintergrundfarbe
          <input
            type="color"
            value={themeSettings.background_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ background_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Button-Farbe
          <input
            type="color"
            value={themeSettings.button_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ button_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Schriftfarbe Haupttext
          <input
            type="color"
            value={themeSettings.text_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ text_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Schriftfarbe Sekundärtext
          <input
            type="color"
            value={themeSettings.text_secondary_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ text_secondary_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Schriftfarbe Muted Text
          <input
            type="color"
            value={themeSettings.text_muted_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ text_muted_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Karten-Hintergrund
          <input
            type="color"
            value={themeSettings.card_background_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ card_background_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Karten-Schriftfarbe
          <input
            type="color"
            value={themeSettings.card_text_color}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ card_text_color: event.target.value })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Border-Radius
          <input
            type="number"
            min={0}
            max={30}
            value={themeSettings.border_radius}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ border_radius: Number(event.target.value || "0") })}
            className="field-input mt-1 h-11 w-full rounded-[10px] px-3"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Dark/Light Mode Standard
          <select
            value={defaultThemeMode}
            disabled={!canEdit}
            onChange={(event) => onDefaultThemeModeChange(event.target.value as SiteSettings["default_theme_mode"])}
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Karten-Design
          <select
            value={themeSettings.card_style}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ card_style: event.target.value })}
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          >
            <option value="soft">soft</option>
            <option value="clean">clean</option>
            <option value="outlined">outlined</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Textlogo
          <input
            value={themeSettings.text_logo ?? ""}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ text_logo: normalizeText(event.target.value, 40) || null })}
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Logo URL
          <input
            value={themeSettings.logo_url ?? ""}
            disabled={!canEdit}
            onChange={(event) => onThemePatch({ logo_url: normalizeText(event.target.value, 500) || null })}
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Hero Background URL
          <input
            value={themeSettings.hero_background_url ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onThemePatch({ hero_background_url: normalizeText(event.target.value, 500) || null })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
      </div>

      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="action-ghost cursor-pointer">
            Logo hochladen
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (file) {
                  await onUploadLogo(file)
                }
              }}
            />
          </label>
          <label className="action-ghost cursor-pointer">
            Hero Bild hochladen
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (file) {
                  await onUploadHero(file)
                }
              }}
            />
          </label>
        </div>
      )}

      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void onSave()}
          >
            Design speichern
          </button>
          <button type="button" className="action-ghost" onClick={onReset}>
            Zurücksetzen
          </button>
        </div>
      )}
    </section>
  )
}
