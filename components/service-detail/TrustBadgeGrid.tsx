import type { Service } from "@/app/types"

type TrustBadgeGridProps = {
  service: Service
}

type TrustBadge = {
  label: string
  checked: boolean
  pendingText: string
  description: string
}

export default function TrustBadgeGrid({ service }: TrustBadgeGridProps) {
  const badges: TrustBadge[] = [
    {
      label: "Profil geprueft",
      checked: Boolean(service.is_verified),
      pendingText: "Profilpruefung ausstehend",
      description: "Hilfinio prueft Profildaten und auffaellige Angaben.",
    },
    {
      label: "E-Mail verifiziert",
      checked: Boolean(service.email_verified),
      pendingText: "E-Mail nicht sichtbar verifiziert",
      description: "Bestaetigte E-Mail reduziert Spam- und Wegwerfprofile.",
    },
    {
      label: "Telefon verifiziert",
      checked: Boolean(service.phone_verified),
      pendingText: "Telefon nicht sichtbar verifiziert",
      description: "Telefonverifizierung ist ein optionaler zusaetzlicher Vertrauensanker.",
    },
    {
      label: "Ausweis geprueft",
      checked: Boolean(service.identity_verified),
      pendingText: "Ausweispruefung ausstehend",
      description: "Ausweisdaten werden nicht oeffentlich angezeigt.",
    },
    {
      label: "Gewerbe geprueft",
      checked: Boolean(service.business_verified),
      pendingText: "Gewerbenachweis ausstehend",
      description: "Relevant fuer professionelle Anbieter und Firmen.",
    },
    {
      label: "Top Rated",
      checked: Boolean(service.is_top_rated),
      pendingText: "Top-Rated noch nicht erreicht",
      description: "Basiert auf verifizierten Bewertungen, Antwortquote und Abschlussrate.",
    },
  ]

  return (
    <section className="card-surface rounded-[14px] p-5" aria-labelledby="trust-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="trust-heading" className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Vertrauen & Sicherheit
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Badges zeigen nur echte oder vorbereitete Pruefstatus. Fehlende Daten werden bewusst nicht geschoent.
          </p>
        </div>
        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          Plattformschutz
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {badges.map((badge) => (
          <div
            key={badge.label}
            title={badge.description}
            className={`rounded-[12px] border px-3 py-3 text-sm ${
              badge.checked
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "border-[var(--surface-border)] bg-[var(--surface-muted)] text-slate-700 dark:text-slate-300"
            }`}
          >
            <p className="font-semibold">{badge.checked ? badge.label : badge.pendingText}</p>
            <p className="mt-1 text-xs leading-5 opacity-80">{badge.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
