type UploadLike = {
  name: string
  size: number
  type: string
}

type UploadPolicy = {
  maxFiles: number
  maxBytes: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  label: string
}

export type UploadPreset = "serviceMedia" | "siteAsset"

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"] as const
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"] as const

export const SERVICE_MEDIA_POLICY: UploadPolicy = {
  maxFiles: 6,
  maxBytes: 50 * 1024 * 1024,
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES],
  allowedExtensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
  label: "Bilder oder Videos",
}

export const SITE_ASSET_POLICY: UploadPolicy = {
  maxFiles: 1,
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [...IMAGE_MIME_TYPES],
  allowedExtensions: [...IMAGE_EXTENSIONS],
  label: "Bilder",
}

export const UPLOAD_PRESET_CONFIG: Record<
  UploadPreset,
  {
    bucket: "service-media" | "site-assets"
    policy: UploadPolicy
  }
> = {
  serviceMedia: {
    bucket: "service-media",
    policy: SERVICE_MEDIA_POLICY,
  },
  siteAsset: {
    bucket: "site-assets",
    policy: SITE_ASSET_POLICY,
  },
}

function normalizeExtension(name: string) {
  const dotIndex = name.lastIndexOf(".")
  if (dotIndex < 0) return ""
  return name.slice(dotIndex).toLowerCase()
}

function hasAllowedExtension(file: UploadLike, policy: UploadPolicy) {
  return policy.allowedExtensions.includes(normalizeExtension(file.name))
}

function hasAllowedMimeType(file: UploadLike, policy: UploadPolicy) {
  return policy.allowedMimeTypes.includes(file.type.toLowerCase())
}

export function validateUploadFile(file: UploadLike, policy: UploadPolicy) {
  if (!file.name || !file.type) {
    return { ok: false as const, message: "Datei ohne gueltigen Namen oder Typ wurde uebersprungen." }
  }
  if (!hasAllowedMimeType(file, policy) || !hasAllowedExtension(file, policy)) {
    return {
      ok: false as const,
      message: `${file.name}: nur ${policy.label.toLowerCase()} in erlaubten Formaten sind zulaessig.`,
    }
  }
  if (file.size <= 0) {
    return { ok: false as const, message: `${file.name}: Datei ist leer.` }
  }
  if (file.size > policy.maxBytes) {
    return {
      ok: false as const,
      message: `${file.name}: Datei ist groesser als ${Math.round(policy.maxBytes / (1024 * 1024))} MB.`,
    }
  }

  return { ok: true as const }
}

export function validateUploadSelection<T extends UploadLike>(files: T[], policy: UploadPolicy) {
  const accepted: T[] = []
  const rejected: string[] = []

  for (const file of files) {
    if (accepted.length >= policy.maxFiles) {
      rejected.push(`Maximal ${policy.maxFiles} Dateien erlaubt.`)
      break
    }

    const validation = validateUploadFile(file, policy)
    if (validation.ok) {
      accepted.push(file)
    } else {
      rejected.push(validation.message)
    }
  }

  return { accepted, rejected }
}

export function buildStorageObjectPath(scope: string, originalName: string) {
  const extension = normalizeExtension(originalName) || ".bin"
  const baseName = originalName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "upload"
  const uniquePart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

  return `${scope}/${uniquePart}-${baseName}${extension}`
}
