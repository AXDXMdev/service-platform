"use client"

import { normalizeText } from "@/lib/validation"
import type { CmsCategory } from "@/lib/siteSettings"

export type NewCategoryDraft = {
  slug: string
  name: string
  icon: string
  description: string
  color: string
}

type AdminCategoriesModuleProps = {
  canEdit: boolean
  categories: CmsCategory[]
  newCategory: NewCategoryDraft
  onNewCategoryPatch: (patch: Partial<NewCategoryDraft>) => void
  onCreateCategory: () => Promise<void>
  onCategoryPatch: (categoryId: string, patch: Partial<CmsCategory>) => void
  onSaveCategory: (category: CmsCategory) => Promise<void>
}

export function AdminCategoriesModule({
  canEdit,
  categories,
  newCategory,
  onNewCategoryPatch,
  onCreateCategory,
  onCategoryPatch,
  onSaveCategory,
}: AdminCategoriesModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Kategorien verwalten</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input
          placeholder="slug"
          value={newCategory.slug}
          disabled={!canEdit}
          onChange={(event) =>
            onNewCategoryPatch({ slug: normalizeText(event.target.value.toLowerCase(), 50) })
          }
          className="field-input min-h-11 rounded-[10px] px-3"
        />
        <input
          placeholder="Name"
          value={newCategory.name}
          disabled={!canEdit}
          onChange={(event) => onNewCategoryPatch({ name: normalizeText(event.target.value, 80) })}
          className="field-input min-h-11 rounded-[10px] px-3"
        />
        <input
          placeholder="Icon"
          value={newCategory.icon}
          disabled={!canEdit}
          onChange={(event) => onNewCategoryPatch({ icon: normalizeText(event.target.value, 60) })}
          className="field-input min-h-11 rounded-[10px] px-3"
        />
        <input
          placeholder="Beschreibung"
          value={newCategory.description}
          disabled={!canEdit}
          onChange={(event) =>
            onNewCategoryPatch({ description: normalizeText(event.target.value, 220) })
          }
          className="field-input min-h-11 rounded-[10px] px-3 lg:col-span-2"
        />
        <input
          type="color"
          value={newCategory.color}
          disabled={!canEdit}
          onChange={(event) => onNewCategoryPatch({ color: event.target.value })}
          className="field-input min-h-11 rounded-[10px] px-2"
        />
      </div>

      {canEdit && (
        <button
          type="button"
          className="btn-primary mt-3 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void onCreateCategory()}
        >
          Kategorie erstellen
        </button>
      )}

      <div className="mt-4 space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="panel-muted rounded-[10px] p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <input value={category.slug} disabled className="field-input min-h-10 rounded-[8px] px-3 text-sm" />
              <input
                value={category.name}
                disabled={!canEdit}
                onChange={(event) => onCategoryPatch(category.id, { name: normalizeText(event.target.value, 80) })}
                className="field-input min-h-10 rounded-[8px] px-3 text-sm"
              />
              <input
                value={category.icon}
                disabled={!canEdit}
                onChange={(event) => onCategoryPatch(category.id, { icon: normalizeText(event.target.value, 60) })}
                className="field-input min-h-10 rounded-[8px] px-3 text-sm"
              />
              <input
                value={category.description}
                disabled={!canEdit}
                onChange={(event) =>
                  onCategoryPatch(category.id, { description: normalizeText(event.target.value, 220) })
                }
                className="field-input min-h-10 rounded-[8px] px-3 text-sm lg:col-span-2"
              />
              <div className="flex items-center gap-2">
                <input type="color" value={category.color} disabled className="field-input h-10 w-14 rounded-[8px] px-1" />
                <label className="inline-flex items-center gap-1 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={category.is_active}
                    disabled={!canEdit}
                    onChange={(event) => onCategoryPatch(category.id, { is_active: event.target.checked })}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Aktiv
                </label>
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                className="action-ghost mt-2 text-xs"
                onClick={() => void onSaveCategory(category)}
              >
                Speichern
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
