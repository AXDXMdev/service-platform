export type Coords = {
  lat: number
  lng: number
}

export function roundCoords(coords: Coords, precision = 2): Coords {
  const factor = 10 ** precision

  return {
    lat: Math.round(coords.lat * factor) / factor,
    lng: Math.round(coords.lng * factor) / factor,
  }
}

export function getDistanceKm(a: Coords, b: Coords) {
  const earthRadiusKm = 6371
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return earthRadiusKm * c
}

export function formatDistanceKm(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) return null
  if (distanceKm < 1) return "unter 1 km"

  const rounded = Math.round(distanceKm / 5) * 5
  return `ca. ${rounded} km`
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
