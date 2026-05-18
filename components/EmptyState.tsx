import Link from "next/link"

type EmptyStateAction = {
  href: string
  label: string
}

type EmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export default function EmptyState({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`card-surface rounded-[12px] border-dashed p-8 text-center sm:p-10 ${className}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="btn-primary min-h-11 justify-center rounded-[10px] px-5 py-3 text-sm font-semibold text-white"
            >
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="btn-secondary min-h-11 justify-center rounded-[10px] px-5 py-3 text-sm font-semibold"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
