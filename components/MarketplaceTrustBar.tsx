import Link from "next/link"

type TrustItem = {
  label: string
  value: string
  href?: string
}

type MarketplaceTrustBarProps = {
  items?: TrustItem[]
  className?: string
  compact?: boolean
}

const defaultTrustItems: TrustItem[] = [
  {
    label: "Anbieterprüfung",
    value: "Verifizierte Profile sichtbar",
    href: "/provider-verification",
  },
  {
    label: "Regionale Naehe",
    value: "Stuttgart, Esslingen und Umgebung",
    href: "/services",
  },
  {
    label: "Sichere Anfragen",
    value: "Missbrauch melden und prüfen lassen",
    href: "/report",
  },
  {
    label: "Datenschutz",
    value: "DSGVO-Rechte und Consent steuerbar",
    href: "/datenschutz",
  },
]

export default function MarketplaceTrustBar({
  items = defaultTrustItems,
  className = "",
  compact = false,
}: MarketplaceTrustBarProps) {
  return (
    <section
      aria-label="Hilfinio Vertrauenssignale"
      className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"} ${className}`}
    >
      {items.map((item) => {
        const content = (
          <>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span className="mt-1 block text-sm font-semibold leading-6 text-slate-950 dark:text-slate-100">
              {item.value}
            </span>
          </>
        )

        if (!item.href) {
          return (
            <div key={`${item.label}-${item.value}`} className="card-surface rounded-[12px] p-4">
              {content}
            </div>
          )
        }

        return (
          <Link
            key={`${item.label}-${item.value}`}
            href={item.href}
            className="card-surface interactive-card rounded-[12px] p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          >
            {content}
          </Link>
        )
      })}
    </section>
  )
}
