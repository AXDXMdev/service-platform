import type { User } from "@supabase/supabase-js"
import {
  buildStorageObjectPath,
  UPLOAD_PRESET_CONFIG,
  type UploadPreset,
  validateUploadFile,
} from "@/lib/mediaUpload"
import { normalizeText } from "@/lib/validation"

type StorageAdminClient = {
  storage: {
    from(bucket: string): {
      createSignedUploadUrl(
        path: string,
        options?: { upsert?: boolean }
      ): Promise<{ data: { path: string; token: string } | null; error: { message: string } | null }>
      getPublicUrl(path: string): { data: { publicUrl: string } }
    }
  }
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { role?: string | null } | null; error: { message: string } | null }>
      }
    }
  }
}

function invalid(message: string) {
  return { ok: false as const, message }
}

export function validateUploadGrantInput(input: unknown) {
  const payload = (input ?? {}) as {
    kind?: string
    fileName?: string
    fileSize?: number | string
    contentType?: string
  }

  const kind = normalizeText(payload.kind ?? "", 40)
  if (kind !== "serviceMedia" && kind !== "siteAsset") {
    return invalid("Ungueltiger Upload-Typ.")
  }

  const fileName = normalizeText(payload.fileName ?? "", 180)
  const fileSize = Number(payload.fileSize)
  const contentType = normalizeText(payload.contentType ?? "", 120).toLowerCase()

  if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0 || !contentType) {
    return invalid("Dateiname, Dateityp und Dateigroesse sind erforderlich.")
  }

  const preset = UPLOAD_PRESET_CONFIG[kind]
  const fileValidation = validateUploadFile(
    {
      name: fileName,
      size: fileSize,
      type: contentType,
    },
    preset.policy
  )

  if (!fileValidation.ok) {
    return invalid(fileValidation.message)
  }

  return {
    ok: true as const,
    value: {
      kind: kind as UploadPreset,
      fileName,
      fileSize,
      contentType,
    },
  }
}

async function requireSiteAssetAccess(admin: StorageAdminClient, user: User) {
  const profile = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile.error) {
    return { ok: false as const, status: 500, message: "Admin-Rolle konnte nicht geprueft werden." }
  }

  if (profile.data?.role !== "admin") {
    return { ok: false as const, status: 403, message: "Nur Admins duerfen Site-Assets hochladen." }
  }

  return { ok: true as const }
}

export async function createSignedUploadGrant(
  admin: StorageAdminClient,
  user: User,
  input: {
    kind: UploadPreset
    fileName: string
    contentType: string
    fileSize: number
  }
) {
  const preset = UPLOAD_PRESET_CONFIG[input.kind]

  if (input.kind === "siteAsset") {
    const access = await requireSiteAssetAccess(admin, user)
    if (!access.ok) {
      return access
    }
  }

  const scope = input.kind === "serviceMedia" ? user.id : "admin"
  const path = buildStorageObjectPath(scope, input.fileName)

  const signed = await admin.storage.from(preset.bucket).createSignedUploadUrl(path, { upsert: false })
  if (signed.error || !signed.data?.token) {
    return {
      ok: false as const,
      status: 500,
      message: "Upload-Freigabe konnte nicht erstellt werden.",
    }
  }

  const publicUrl = admin.storage.from(preset.bucket).getPublicUrl(path).data.publicUrl

  return {
    ok: true as const,
    data: {
      bucket: preset.bucket,
      path,
      token: signed.data.token,
      publicUrl,
      contentType: input.contentType,
      maxBytes: preset.policy.maxBytes,
    },
  }
}
