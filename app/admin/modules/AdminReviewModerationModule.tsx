"use client"

import type { PendingReviewRow } from "@/app/admin/adminShared"

type AdminReviewModerationModuleProps = {
  canEdit: boolean
  reviews: PendingReviewRow[]
  onApprove: (review: PendingReviewRow) => Promise<void>
}

export function AdminReviewModerationModule({
  canEdit,
  reviews,
  onApprove,
}: AdminReviewModerationModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Review-Foto-Prüfung</h2>
      <div className="mt-4 space-y-2">
        {reviews.length === 0 && (
          <p className="panel-muted rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            Keine offenen Reviews oder Tabelle/Spalten fehlen.
          </p>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="panel-muted rounded-[10px] p-3">
            <p className="text-sm font-semibold">
              {review.service_title ?? "Service"} · {review.rating}/5
            </p>
            {review.comment && (
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{review.comment}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {(review.proof_image_urls ?? []).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="action-ghost text-xs">
                  Proof
                </a>
              ))}
            </div>
            {canEdit && (
              <button
                type="button"
                className="action-btn action-accept mt-2"
                onClick={() => onApprove(review)}
              >
                Freigeben
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
