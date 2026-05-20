"use client"

import { useState } from "react"
import { authenticatedFetch } from "@/lib/authenticatedApi"

const categories = [
  { value: "bug", label: "Technischer Bug" },
  { value: "illegal_content", label: "Rechtswidriger Inhalt" },
  { value: "fraud", label: "Betrug / Scam" },
  { value: "harassment", label: "Belaestigung / Missbrauch" },
  { value: "privacy", label: "Datenschutzproblem" },
  { value: "other", label: "Sonstiges Problem" },
] as const

export default function ReportPage() {
  const [category, setCategory] = useState<(typeof categories)[number]["value"]>("illegal_content")
  const [targetUrl, setTargetUrl] = useState("")
  const [targetEntityId, setTargetEntityId] = useState("")
  const [description, setDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setStatus("")
    setSending(true)
    const response = await authenticatedFetch("/api/report", {
      method: "POST",
      body: JSON.stringify({
        category,
        targetUrl,
        targetEntityId,
        description,
        contactEmail,
        website,
      }),
    })
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; data?: { message?: string }; error?: { message?: string } }
      | null
    setSending(false)

    if (!response.ok) {
      setStatus(payload?.error?.message ?? "Meldung konnte nicht gespeichert werden.")
      return
    }

    setTargetUrl("")
    setTargetEntityId("")
    setDescription("")
    setContactEmail("")
    setWebsite("")
    setStatus(payload?.data?.message ?? "Meldung gespeichert.")
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
            Inhalt oder Problem melden
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Nutze dieses Formular für technische Bugs sowie Meldungen zu rechtswidrigen
            Inhalten, Betrug, Belaestigung, Datenschutzproblemen oder sonstigen Plattformproblemen.
          </p>

          {status ? (
            <p className="panel-muted mt-4 rounded-[10px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              {status}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Kategorie
              </span>
              <select
                className="field-input min-h-12 w-full rounded-[10px] px-4"
                value={category}
                onChange={(event) => setCategory(event.target.value as typeof category)}
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Betroffene URL (optional)"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Betroffene ID oder Referenz (optional)"
              value={targetEntityId}
              onChange={(event) => setTargetEntityId(event.target.value)}
            />
            <textarea
              className="field-input min-h-32 rounded-[10px] px-4 py-3"
              placeholder="Beschreibe den Bug oder das Problem moeglichst konkret. Was ist passiert, wo und wann?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Kontakt-E-Mail (optional)"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="mt-6 rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sende Meldung..." : "Meldung absenden"}
          </button>
        </section>
      </div>
    </main>
  )
}
