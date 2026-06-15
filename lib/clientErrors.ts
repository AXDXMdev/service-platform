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

export function humanizeAuthCallbackError(code: string | null | undefined) {
  switch (code) {
    case "auth_link_missing":
      return "Der Bestätigungslink ist unvollständig. Bitte fordere eine neue E-Mail an."
    case "auth_link_invalid":
      return "Der Bestätigungslink ist ungültig. Bitte öffne den neuesten Link aus deiner E-Mail."
    case "auth_link_expired":
      return "Der Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Bitte fordere eine neue E-Mail an."
    case "auth_callback":
      return "Die Anmeldung über den E-Mail-Link ist fehlgeschlagen. Bitte versuche es erneut."
    default:
      return ""
  }
}

export function humanizeWaitlistError(raw: string) {
  if (/waitlist_entries|relation|schema|table|column/i.test(raw)) {
    return "Warteliste ist gerade nicht erreichbar. Bitte versuche es später erneut oder schreibe uns direkt per E-Mail."
  }

  return "Eintrag konnte gerade nicht gespeichert werden. Bitte später erneut versuchen."
}
