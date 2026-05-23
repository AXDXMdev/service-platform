export const PILOT_MODE_ENABLED = true

export const PILOT_CITIES = ["Stuttgart", "Esslingen", "Ludwigsburg", "Fellbach", "Waiblingen"] as const

export function normalizeCityName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function isPilotCity(city: string | null | undefined) {
  if (!city) return false
  const normalized = normalizeCityName(city)
  return PILOT_CITIES.some(
    (item) => normalizeCityName(item) === normalized
  )
}

export function pilotCityLabel() {
  return PILOT_CITIES.join(", ")
}
