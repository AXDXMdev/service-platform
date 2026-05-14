"use client"

import { normalizeText } from "@/lib/validation"
import { parseLines, toLines } from "@/app/admin/adminShared"
import type { HomepageSection, SiteSettings } from "@/lib/siteSettings"

type AdminHomepageModuleProps = {
  canEdit: boolean
  siteSettings: SiteSettings
  homepageSections: HomepageSection[]
  onSiteSettingsPatch: (patch: Partial<SiteSettings>) => void
  onHomepageSectionToggle: (sectionKey: string, enabled: boolean) => void
  onSave: () => Promise<void>
}

export function AdminHomepageModule({
  canEdit,
  siteSettings,
  homepageSections,
  onSiteSettingsPatch,
  onHomepageSectionToggle,
  onSave,
}: AdminHomepageModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Startseite bearbeiten</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Hero Titel
          <input
            value={siteSettings.hero_title ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onSiteSettingsPatch({ hero_title: normalizeText(event.target.value, 180) || null })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Hero Subheadline
          <input
            value={siteSettings.hero_subheadline ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onSiteSettingsPatch({ hero_subheadline: normalizeText(event.target.value, 280) || null })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          CTA Find
          <input
            value={siteSettings.hero_cta_find ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onSiteSettingsPatch({ hero_cta_find: normalizeText(event.target.value, 70) || null })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          CTA Offer
          <input
            value={siteSettings.hero_cta_offer ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onSiteSettingsPatch({ hero_cta_offer: normalizeText(event.target.value, 70) || null })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Trust Badges (1 pro Zeile)
          <textarea
            value={toLines(siteSettings.trust_badges)}
            disabled={!canEdit}
            onChange={(event) => onSiteSettingsPatch({ trust_badges: parseLines(event.target.value) })}
            className="field-input mt-1 min-h-28 w-full rounded-[10px] px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Pilot Cities (1 pro Zeile)
          <textarea
            value={toLines(siteSettings.pilot_cities)}
            disabled={!canEdit}
            onChange={(event) => onSiteSettingsPatch({ pilot_cities: parseLines(event.target.value) })}
            className="field-input mt-1 min-h-28 w-full rounded-[10px] px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm font-semibold">
        Notice Boxes (1 pro Zeile)
        <textarea
          value={toLines(siteSettings.notice_boxes)}
          disabled={!canEdit}
          onChange={(event) => onSiteSettingsPatch({ notice_boxes: parseLines(event.target.value) })}
          className="field-input mt-1 min-h-24 w-full rounded-[10px] px-3 py-2"
        />
      </label>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold">Homepage Sections</p>
        {homepageSections.map((section) => (
          <label
            key={section.key}
            className="panel-muted flex items-center justify-between rounded-[10px] px-3 py-2"
          >
            <span className="text-sm font-semibold">
              {section.label} ({section.key})
            </span>
            <input
              type="checkbox"
              checked={section.enabled}
              disabled={!canEdit}
              onChange={(event) => onHomepageSectionToggle(section.key, event.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
          </label>
        ))}
      </div>

      {canEdit && (
        <button
          type="button"
          className="btn-primary mt-4 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void onSave()}
        >
          Startseite speichern
        </button>
      )}
    </section>
  )
}
