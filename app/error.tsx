"use client"

import { useLanguage } from "@/components/LanguageProvider"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen px-6 py-16 sm:px-10 lg:px-12">
      <section className="card-surface mx-auto max-w-2xl rounded-[14px] p-7 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">
          {t("errorLabel")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{t("errorTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("errorText")}
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t("errorId")}: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="btn-primary mt-6 justify-center px-5 py-3 font-semibold"
        >
          {t("errorRetry")}
        </button>
      </section>
    </main>
  )
}
