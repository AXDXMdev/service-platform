"use client"

import type { ProviderRow, ServiceAdminRow } from "@/app/admin/adminShared"

type AdminServicesOverviewModuleProps = {
  services: ServiceAdminRow[]
  providers: ProviderRow[]
}

export function AdminServicesOverviewModule({
  services,
  providers,
}: AdminServicesOverviewModuleProps) {
  return (
    <section className="card-surface rounded-[14px] p-6">
      <h2 className="text-xl font-semibold">Services / Anbieter</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Verwaltung ist aktiv. Falls Tabellen/Spalten fehlen, wird das hier nicht crashen.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Services (Auszug)</p>
          {services.slice(0, 12).map((service) => (
            <div key={service.id} className="panel-muted rounded-[10px] px-3 py-2 text-sm">
              <span className="font-semibold">{service.title}</span>
              <span className="text-slate-600 dark:text-slate-300"> · {service.city ?? "n/a"}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Anbieter (Auszug)</p>
          {providers.slice(0, 12).map((provider) => (
            <div key={provider.user_id} className="panel-muted rounded-[10px] px-3 py-2 text-sm">
              <span className="font-semibold">{provider.full_name ?? provider.user_id.slice(0, 8)}</span>
              <span className="text-slate-600 dark:text-slate-300"> · {provider.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
