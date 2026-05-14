"use client"

import { normalizeText } from "@/lib/validation"

type SiteContentSection = "footer" | "help" | "accessibility"

type AdminContentModuleProps = {
  canEdit: boolean
  footerContent: Record<string, string>
  helpContent: Record<string, string>
  accessibilityContent: Record<string, string>
  onSectionPatch: (section: SiteContentSection, patch: Record<string, unknown>) => void
  onSave: () => Promise<void>
}

export function AdminContentModule({
  canEdit,
  footerContent,
  helpContent,
  accessibilityContent,
  onSectionPatch,
  onSave,
}: AdminContentModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Content (Footer/FAQ/Hilfe)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Impressum Linktext
          <input
            value={footerContent.impressum_label ?? "Impressum"}
            disabled={!canEdit}
            onChange={(event) =>
              onSectionPatch("footer", { impressum_label: normalizeText(event.target.value, 80) })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Datenschutz Linktext
          <input
            value={footerContent.datenschutz_label ?? "Datenschutz"}
            disabled={!canEdit}
            onChange={(event) =>
              onSectionPatch("footer", { datenschutz_label: normalizeText(event.target.value, 80) })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Footer Text
          <input
            value={footerContent.footer_text ?? ""}
            disabled={!canEdit}
            onChange={(event) =>
              onSectionPatch("footer", { footer_text: normalizeText(event.target.value, 220) })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Hilfe Titel
          <input
            value={helpContent.title ?? "Hilfe"}
            disabled={!canEdit}
            onChange={(event) => onSectionPatch("help", { title: normalizeText(event.target.value, 80) })}
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Hilfe Text
          <textarea
            value={helpContent.text ?? ""}
            disabled={!canEdit}
            onChange={(event) => onSectionPatch("help", { text: normalizeText(event.target.value, 700) })}
            className="field-input mt-1 min-h-20 w-full rounded-[10px] px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Barrierefreiheit Titel
          <input
            value={accessibilityContent.title ?? "Barrierefreiheit"}
            disabled={!canEdit}
            onChange={(event) =>
              onSectionPatch("accessibility", { title: normalizeText(event.target.value, 80) })
            }
            className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
          />
        </label>
      </div>
      {canEdit && (
        <button
          type="button"
          className="btn-primary mt-4 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void onSave()}
        >
          Content speichern
        </button>
      )}
    </section>
  )
}
