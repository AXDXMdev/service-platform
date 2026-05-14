"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { authenticatedFetch } from "@/lib/authenticatedApi"
import { getChatMessages } from "@/lib/dashboardApi"
import type { ChatMessage } from "@/app/types"
import { normalizeText } from "@/lib/validation"

export default function RequestChatPage() {
  const params = useParams()
  const requestId = String(params.requestId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [status, setStatus] = useState("")
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getChatMessages(requestId)
        setCurrentUserId(data.currentUserId)
        setMessages(data.messages)
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Chat konnte nicht geladen werden."
        )
      }
    }

    void load()
  }, [requestId])

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">Anfragen-Chat</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Direkter Austausch zu Anfrage #{requestId.slice(0, 8)}
          </p>

          {status && (
            <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {status}
            </p>
          )}

          <div className="panel-muted mt-5 max-h-[420px] space-y-2 overflow-y-auto rounded-[12px] p-3">
            {messages.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Noch keine Nachrichten.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-[10px] px-3 py-2 text-sm ${
                  message.sender_id === currentUserId
                    ? "ml-auto bg-[var(--brand)] text-white"
                    : "bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                }`}
              >
                <p>{message.message}</p>
                <p className="mt-1 text-[11px] opacity-75">
                  {new Date(message.created_at).toLocaleString("de-DE")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="field-input min-h-12 flex-1 rounded-[10px] px-4"
              placeholder="Nachricht schreiben..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              disabled={sending}
              className="rounded-[10px] bg-[var(--brand)] px-4 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={async () => {
                const text = normalizeText(draft, 1500)
                if (!text) return
                setStatus("")
                setSending(true)

                const response = await authenticatedFetch("/api/chat", {
                  method: "POST",
                  body: JSON.stringify({
                    requestId,
                    message: text.slice(0, 1500),
                  }),
                })

                if (!response.ok) {
                  const responseBody = (await response.json().catch(() => null)) as
                    | { error?: { message?: string } }
                    | null
                  setStatus(responseBody?.error?.message ?? "Senden fehlgeschlagen.")
                  setSending(false)
                  return
                }

                const responseBody = (await response.json()) as { data: ChatMessage }
                setMessages((current) => [...current, responseBody.data])
                setDraft("")
                setSending(false)
              }}
            >
              Senden
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
