import PageContentHeader from "@/components/PageContentHeader"
import { LEGAL_NOTES, LEGAL_OPERATOR, hasOperatorAddress, hasVsbgStatus } from "@/lib/legal"
import { buildDefaultMetadata } from "@/lib/seo"

export const metadata = buildDefaultMetadata({
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung von Hilfinio.",
  path: "/impressum",
})

export default function ImpressumPage() {
  const hasPostalAddress = hasOperatorAddress()
  const resolvedVsbgStatus = hasVsbgStatus()

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <PageContentHeader
            slug="impressum"
            fallbackTitle="Impressum"
            fallbackSubtitle="Angaben gemäß § 5 DDG und weitere Pflichtinformationen für Hilfinio."
          />
        </section>

        <section className="card-surface mt-6 rounded-[14px] p-7 leading-7 text-slate-800 dark:text-slate-200">
          {!hasPostalAddress ? (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              <p className="font-semibold">Launch-Blocker</p>
              <p>{LEGAL_NOTES.missingPostalAddress}</p>
            </div>
          ) : null}
          {!resolvedVsbgStatus ? (
            <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">TODO_LEGAL_REVIEW</p>
              <p>{LEGAL_NOTES.missingVsbgStatus}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <p className="font-semibold">Diensteanbieter</p>
            <p>{LEGAL_OPERATOR.name}</p>
            {LEGAL_OPERATOR.addressMultiline.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-5">
            <p className="font-semibold">Kontakt</p>
            <p>E-Mail: {LEGAL_OPERATOR.email}</p>
            {LEGAL_OPERATOR.phone ? <p>Telefon: {LEGAL_OPERATOR.phone}</p> : null}
          </div>

          <div className="mt-5">
            <p className="font-semibold">Inhaltlich verantwortlich</p>
            <p>{LEGAL_OPERATOR.name}</p>
            {LEGAL_OPERATOR.addressMultiline.map((line) => (
              <p key={`responsible-${line}`}>{line}</p>
            ))}
          </div>

          {LEGAL_OPERATOR.responsiblePersonMstv ? (
            <div className="mt-5">
              <p className="font-semibold">Verantwortlich nach § 18 Abs. 2 MStV</p>
              <p>{LEGAL_OPERATOR.responsiblePersonMstv}</p>
            </div>
          ) : null}

          {LEGAL_OPERATOR.vatId ? (
            <div className="mt-5">
              <p className="font-semibold">Umsatzsteuer-Identifikationsnummer</p>
              <p>{LEGAL_OPERATOR.vatId}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <p className="font-semibold">Verbraucherstreitbeilegung</p>
            <p>{LEGAL_NOTES.disputeResolution}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {LEGAL_NOTES.odrDiscontinued}
            </p>
          </div>

          <div className="mt-6 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-semibold">TODO_LEGAL_REVIEW</p>
            <p>{LEGAL_NOTES.legalReview}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
