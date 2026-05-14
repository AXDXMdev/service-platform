type CacheEntry<T> = {
  value: T
  expiresAt: number
}

function getStorage() {
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

export function getCached<T>(key: string): T | null {
  const storage = getStorage()
  if (!storage) return null

  const raw = storage.getItem(key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (parsed.expiresAt <= Date.now()) {
      storage.removeItem(key)
      return null
    }
    return parsed.value
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function setCached<T>(key: string, value: T, ttlMs = 60_000) {
  const storage = getStorage()
  if (!storage) return

  const payload: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  }
  storage.setItem(key, JSON.stringify(payload))
}

export function clearCached(key: string) {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(key)
}
