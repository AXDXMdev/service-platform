"use client"

import type { AuditEventRow } from "@/app/admin/adminShared"

type AdminAuditModuleProps = {
  auditEvents: AuditEventRow[]
}

export function AdminAuditModule({ auditEvents }: AdminAuditModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Admin Audit Panel</h2>
      <div className="mt-4 space-y-2">
        {auditEvents.length === 0 && (
          <p className="panel-muted rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            Keine Events oder Tabelle fehlt (request_events).
          </p>
        )}
        {auditEvents.map((event) => (
          <div key={event.id} className="panel-muted rounded-[10px] p-3">
            <p className="text-sm font-semibold">
              {event.event_type} · {event.from_status ?? "-"} → {event.to_status ?? "-"}
            </p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
              {event.service_title ?? "Service"} · {event.sender_email ?? "n/a"} ·{" "}
              {new Date(event.created_at).toLocaleString("de-DE")}
            </p>
            {event.note && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{event.note}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
