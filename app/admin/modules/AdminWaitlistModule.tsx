"use client"

import { toCsv, type WaitlistRow } from "@/app/admin/adminShared"

type AdminWaitlistModuleProps = {
  canEdit: boolean
  waitlist: WaitlistRow[]
  onChangeStatus: (entryId: string, status: string) => void
  onSaveStatus: (entry: WaitlistRow) => Promise<void>
}

export function AdminWaitlistModule({
  canEdit,
  waitlist,
  onChangeStatus,
  onSaveStatus,
}: AdminWaitlistModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Warteliste</h2>
        <button
          type="button"
          className="action-ghost"
          onClick={() => {
            const csv = toCsv(waitlist)
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement("a")
            anchor.href = url
            anchor.download = `hilfino-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
            anchor.click()
            URL.revokeObjectURL(url)
          }}
        >
          CSV exportieren
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {waitlist.map((entry) => (
          <div key={entry.id} className="panel-muted rounded-[10px] p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <input value={entry.full_name} disabled className="field-input min-h-10 rounded-[8px] px-3 text-sm" />
              <input value={entry.email ?? ""} disabled className="field-input min-h-10 rounded-[8px] px-3 text-sm" />
              <input value={entry.city} disabled className="field-input min-h-10 rounded-[8px] px-3 text-sm" />
              <input value={entry.role} disabled className="field-input min-h-10 rounded-[8px] px-3 text-sm" />
              <select
                value={entry.status}
                disabled={!canEdit}
                onChange={(event) => onChangeStatus(entry.id, event.target.value)}
                className="field-input min-h-10 rounded-[8px] px-3 text-sm"
              >
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="converted">converted</option>
                <option value="archived">archived</option>
              </select>
              <input
                value={new Date(entry.created_at).toLocaleString("de-DE")}
                disabled
                className="field-input min-h-10 rounded-[8px] px-3 text-sm"
              />
            </div>
            {canEdit && (
              <button
                type="button"
                className="action-ghost mt-2 text-xs"
                onClick={() => onSaveStatus(entry)}
              >
                Status speichern
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
