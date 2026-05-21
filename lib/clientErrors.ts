export function humanizeAuthError(raw: string) {
  const lower = raw.toLowerCase()

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("email or password")
  ) {
    return "Falsche E-Mail oder falsches Passwort."
  }

  if (lower.includes("email not confirmed")) {
    return "Bitte zuerst deine E-Mail-Adresse bestätigen."
  }

  if (lower.includes("user already registered")) {
    return "Für diese E-Mail-Adresse gibt es bereits ein Konto."
  }

  if (lower.includes("password should be at least")) {
    return "Das Passwort ist zu kurz."
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Verbindung fehlgeschlagen. Bitte erneut versuchen."
  }

  return "Aktion fehlgeschlagen. Bitte erneut versuchen."
}

export function humanizeWaitlistError(raw: string) {
  if (/waitlist_entries|relation|schema|table|column/i.test(raw)) {
    return "Warteliste ist gerade nicht erreichbar. Bitte versuche es später erneut oder schreibe uns direkt per E-Mail."
  }

  return "Eintrag konnte gerade nicht gespeichert werden. Bitte später erneut versuchen."
}
