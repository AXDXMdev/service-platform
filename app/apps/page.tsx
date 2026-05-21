"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

export default function AppsPage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            {t("appsEyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{t("appsTitle")}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-800 dark:text-slate-300">
            {t("appsText")}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="card-surface interactive-card rounded-[14px] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-slate-900 text-white dark:bg-slate-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
                <path d="M10 5.5h4" />
                <circle cx="12" cy="18.5" r="1" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">{t("appsIosTitle")}</h2>
            <p className="mt-3 leading-7 text-slate-800 dark:text-slate-300">
              {t("appsIosText")}
            </p>
            <Link
              href="/services?utm_source=apps-page&utm_medium=web&utm_campaign=open-launch"
              className="btn-secondary mt-5 min-h-11 justify-center px-4 py-2 text-sm font-semibold"
            >
              Mobile Web-App nutzen
            </Link>
          </article>

          <article className="card-surface interactive-card rounded-[14px] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-slate-900 text-white dark:bg-slate-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                <path d="M8 8h8a2 2 0 0 1 2 2v6.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 16.5V10a2 2 0 0 1 2-2z" />
                <path d="M9 8l-1.5-2" />
                <path d="M15 8l1.5-2" />
                <circle cx="10" cy="12" r=".5" fill="currentColor" />
                <circle cx="14" cy="12" r=".5" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">{t("appsAndroidTitle")}</h2>
            <p className="mt-3 leading-7 text-slate-800 dark:text-slate-300">
              {t("appsAndroidText")}
            </p>
            <Link
              href="/waitlist?utm_source=apps-page&utm_medium=web&utm_campaign=mobile-apps"
              className="btn-secondary mt-5 min-h-11 justify-center px-4 py-2 text-sm font-semibold"
            >
              App-Updates erhalten
            </Link>
          </article>
        </section>
      </div>
    </main>
  )
}
