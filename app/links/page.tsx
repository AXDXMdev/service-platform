import Link from "next/link"
import type { Metadata } from "next"
import { buildDefaultMetadata, canonicalUrl } from "@/lib/seo"

export const metadata: Metadata = buildDefaultMetadata({
  title: "Hilfinio Links",
  description:
    "Alle wichtigen Hilfinio-Links für lokale Dienstleistungen, Anbieter, Warteliste und Vertrauen auf einen Blick.",
  path: "/links",
})

const links = [
  {
    href: "/services?utm_source=social&utm_medium=linkhub&utm_campaign=open-launch",
    label: "Anbieter finden",
    text: "Lokale Dienstleistungen in Stuttgart, Esslingen und Umgebung entdecken.",
    primary: true,
  },
  {
    href: "/create-service?utm_source=social&utm_medium=linkhub&utm_campaign=provider-launch",
    label: "Service anbieten",
    text: "Als Anbieter sichtbar werden und strukturierte Anfragen erhalten.",
    primary: true,
  },
  {
    href: "/provider-verification?utm_source=social&utm_medium=linkhub&utm_campaign=trust",
    label: "Anbieter-Verifizierung",
    text: "Was Hilfinio prüft und wie Verifizierungen eingeordnet werden.",
    primary: false,
  },
  {
    href: "/waitlist?utm_source=social&utm_medium=linkhub&utm_campaign=region-launch",
    label: "Warteliste",
    text: "Interesse für deine Stadt oder Kategorie vormerken.",
    primary: false,
  },
  {
    href: "/plattform-beschwerden?utm_source=social&utm_medium=linkhub&utm_campaign=trust-safety",
    label: "Beschwerden und Meldungen",
    text: "Melde problematische Inhalte oder Plattformthemen sicher.",
    primary: false,
  },
]

export default function LinksPage() {
  const shareUrl = canonicalUrl("/links")

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-8 text-slate-950 dark:bg-[linear-gradient(180deg,#07111f_0%,#0f172a_100%)] dark:text-slate-100 sm:px-8">
      <section className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[16px] bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.65)] ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
          <span className="text-2xl font-extrabold text-[var(--brand)]">H</span>
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Hilfinio
        </p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">
          Lokale Hilfe finden. Services anbieten.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Hilfinio verbindet Kunden und Anbieter in Stuttgart, Esslingen und Umgebung mit
          klaren Anfragen, Profilinformationen und Meldewegen.
        </p>

        <div className="mt-7 grid w-full gap-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.primary
                  ? "rounded-[12px] bg-[var(--brand)] px-5 py-4 text-left text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.55)] transition hover:bg-[var(--brand-strong)]"
                  : "rounded-[12px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] dark:border-slate-800 dark:bg-slate-950"
              }
            >
              <span className="block font-semibold">{item.label}</span>
              <span
                className={
                  item.primary
                    ? "mt-1 block text-sm leading-6 text-white/85"
                    : "mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300"
                }
              >
                {item.text}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-7 w-full rounded-[12px] border border-slate-200 bg-white/80 p-4 text-left text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
          <p className="font-semibold text-slate-950 dark:text-slate-100">Social Preview</p>
          <p className="mt-1">
            Diese Seite nutzt das Hilfinio OpenGraph-Bild für WhatsApp, Instagram-Bio,
            LinkedIn und andere Social-Kanäle.
          </p>
          <p className="mt-2 break-all text-xs">{shareUrl}</p>
        </div>
      </section>
    </main>
  )
}
