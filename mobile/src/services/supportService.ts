import { mockAsync, serviceMode } from "../api/client"
import { supportChannels } from "../data/mockData"
import type { SupportDraft } from "../types"

export async function getSupportChannels() {
  return mockAsync(supportChannels, 130)
}

export async function sendSupportRequest(input: SupportDraft) {
  if (!input.email.trim() || !input.topic.trim() || !input.message.trim()) {
    throw new Error("Bitte E-Mail, Thema und Nachricht ausfuellen.")
  }

  return mockAsync(
    {
      ok: true,
      mode: serviceMode,
      ticketId: `support-${Date.now()}`,
    },
    260
  )
}
