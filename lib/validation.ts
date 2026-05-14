const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export function normalizeText(value: string, maxLength = 4000) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value.trim())
}

export function isStrongPassword(value: string) {
  return value.length >= 8
}

export function toValidHttpUrls(input: string) {
  return input
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter((item) => URL_REGEX.test(item))
}

export function isLikelySpamTrapFilled(value: string) {
  return normalizeText(value, 200).length > 0
}
