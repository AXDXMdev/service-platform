"use client"

import { normalizeText } from "@/lib/validation"
import type { PageContent } from "@/lib/siteSettings"

type AdminPageContentModuleProps = {
  canEdit: boolean
  pageContents: PageContent[]
  onPagePatch: (slug: string, patch: Partial<PageContent>) => void
  onSave: () => Promise<void>
  onReset: () => void
}

export function AdminPageContentModule({
  canEdit,
  pageContents,
  onPagePatch,
  onSave,
  onReset,
}: AdminPageContentModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Page-Inhalte bearbeiten</h2>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void onSave()}
            >
              Page-Inhalte speichern
            </button>
            <button type="button" className="action-ghost" onClick={onReset}>
              Zurücksetzen
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {pageContents.map((page) => (
          <details key={page.slug} className="panel-muted rounded-[10px] p-3" open={page.slug === "home"}>
            <summary className="cursor-pointer text-sm font-semibold">
              {page.slug} · {page.title}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Titel
                <input
                  value={page.title}
                  disabled={!canEdit}
                  onChange={(event) => onPagePatch(page.slug, { title: normalizeText(event.target.value, 160) })}
                  className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Untertitel
                <input
                  value={page.subtitle ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onPagePatch(page.slug, { subtitle: normalizeText(event.target.value, 260) || null })
                  }
                  className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Content
                <textarea
                  value={page.content ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onPagePatch(page.slug, { content: normalizeText(event.target.value, 1600) || null })
                  }
                  className="field-input mt-1 min-h-24 w-full rounded-[10px] px-3 py-2"
                />
              </label>
              <label className="text-sm font-semibold">
                Meta Title
                <input
                  value={page.meta_title ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onPagePatch(page.slug, { meta_title: normalizeText(event.target.value, 160) || null })
                  }
                  className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
                />
              </label>
              <label className="text-sm font-semibold">
                Meta Description
                <input
                  value={page.meta_description ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onPagePatch(page.slug, {
                      meta_description: normalizeText(event.target.value, 260) || null,
                    })
                  }
                  className="field-input mt-1 min-h-11 w-full rounded-[10px] px-3"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={page.is_active}
                  disabled={!canEdit}
                  onChange={(event) => onPagePatch(page.slug, { is_active: event.target.checked })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Aktiv
              </label>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
