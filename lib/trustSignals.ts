export type SpamSignalInput = {
  text?: string | null
  email?: string | null
  urlCount?: number
  accountAgeHours?: number | null
}

export function calculateSpamScore(input: SpamSignalInput) {
  const text = `${input.text ?? ""} ${input.email ?? ""}`.toLowerCase()
  let score = 0

  if (/(crypto|casino|loan|viagra|telegram|whatsapp)/i.test(text)) score += 35
  if ((input.urlCount ?? 0) > 2) score += 25
  if (/(.)\1{8,}/.test(text)) score += 15
  if (input.accountAgeHours != null && input.accountAgeHours < 1) score += 10
  if (text.length > 3000) score += 10

  return Math.min(100, score)
}

export function reputationLabel(score: number) {
  if (score >= 80) return "excellent"
  if (score >= 60) return "trusted"
  if (score >= 35) return "new"
  return "risk_review"
}
