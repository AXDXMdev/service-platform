"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen px-6 py-16 sm:px-10 lg:px-12">
      <section className="card-surface mx-auto max-w-2xl rounded-[14px] p-7 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("notFoundText")}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/services" className="btn-primary justify-center px-5 py-3 font-semibold">
            {t("notFoundPrimary")}
          </Link>
          <Link href="/" className="btn-secondary justify-center px-5 py-3 font-semibold">
            {t("notFoundSecondary")}
          </Link>
        </div>
      </section>
    </main>
  )
}
