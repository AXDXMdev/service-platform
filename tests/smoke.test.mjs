import test from "node:test"
import assert from "node:assert/strict"
const clientErrors = await import("../lib/clientErrors.ts")
const pilotMode = await import("../lib/pilotMode.ts")
const validation = await import("../lib/validation.ts")

test("validation helpers cover common launch-critical inputs", () => {
  assert.equal(validation.normalizeText("  Hallo   Welt  "), "Hallo Welt")
  assert.equal(validation.isValidEmail("team@hilfinio.de"), true)
  assert.equal(validation.isValidEmail("invalid-email"), false)
  assert.equal(validation.isStrongPassword("12345678"), true)
  assert.equal(validation.isStrongPassword("1234567"), false)
  assert.deepEqual(validation.toValidHttpUrls("https://hilfinio.de,\nhttp://example.com\nnotaurl"), [
    "https://hilfinio.de",
    "http://example.com",
  ])
  assert.equal(validation.isLikelySpamTrapFilled(""), false)
  assert.equal(validation.isLikelySpamTrapFilled(" bot "), true)
})

test("pilot mode helpers normalize umlauts and city names", () => {
  assert.equal(pilotMode.normalizeCityName(" München "), "munchen")
  assert.equal(pilotMode.isPilotCity("Muenchen"), false)
  assert.equal(pilotMode.isPilotCity("München"), false)
  assert.equal(pilotMode.isPilotCity("Esslingen"), true)
  assert.match(pilotMode.pilotCityLabel(), /Stuttgart/)
})

test("client error messages stay user-friendly", () => {
  assert.equal(
    clientErrors.humanizeAuthError("Invalid login credentials"),
    "Falsche E-Mail oder falsches Passwort."
  )
  assert.equal(
    clientErrors.humanizeAuthError("Email not confirmed"),
    "Bitte zuerst deine E-Mail-Adresse bestätigen."
  )
  assert.equal(
    clientErrors.humanizeWaitlistError('relation "waitlist_entries" does not exist'),
    "Warteliste ist gerade nicht erreichbar. Bitte versuche es später erneut oder schreibe uns direkt per E-Mail."
  )
  assert.equal(
    clientErrors.humanizeWaitlistError("permission denied"),
    "Eintrag konnte gerade nicht gespeichert werden. Bitte später erneut versuchen."
  )
})
