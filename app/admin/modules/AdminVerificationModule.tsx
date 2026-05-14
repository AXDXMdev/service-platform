"use client"

import type { ProviderVerificationRequestRow } from "@/app/admin/adminShared"

type AdminVerificationModuleProps = {
  canEdit: boolean
  requests: ProviderVerificationRequestRow[]
  onApprove: (request: ProviderVerificationRequestRow) => Promise<void>
  onReject: (request: ProviderVerificationRequestRow) => Promise<void>
}

export function AdminVerificationModule({
  canEdit,
  requests,
  onApprove,
  onReject,
}: AdminVerificationModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Anbieter-Verifizierung (Anträge)</h2>
      <div className="mt-4 space-y-2">
        {requests.length === 0 && (
          <p className="panel-muted rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            Keine offenen Anträge oder Tabelle fehlt (provider_verification_requests).
          </p>
        )}
        {requests.map((request) => (
          <div key={request.id} className="panel-muted rounded-[10px] p-3">
            <p className="text-sm font-semibold">
              {request.company_name} · {request.city} · {request.status}
            </p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
              {request.contact_email ?? "keine E-Mail"} {request.website ? `· ${request.website}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(request.proof_urls ?? []).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="action-ghost text-xs"
                >
                  Proof
                </a>
              ))}
            </div>
            {canEdit && request.status === "pending" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="action-btn action-accept" onClick={() => onApprove(request)}>
                  Verifizieren
                </button>
                <button type="button" className="action-btn action-reject" onClick={() => onReject(request)}>
                  Ablehnen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
