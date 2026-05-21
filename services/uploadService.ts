import type { User } from "@supabase/supabase-js"
import { z } from "zod"
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
  const parsed = z
    .object({
      kind: z.enum(["serviceMedia", "siteAsset"]),
      fileName: z.preprocess(
        (value) => normalizeText(typeof value === "string" ? value : "", 180),
        z.string().min(1)
      ),
      fileSize: z.preprocess((value) => Number(value), z.number().positive()),
      contentType: z.preprocess(
        (value) => normalizeText(typeof value === "string" ? value : "", 120).toLowerCase(),
        z.string().min(1)
      ),
    })
    .safeParse(input ?? {})

  if (!parsed.success) {
    return invalid("Ungültiger Upload-Typ.")
  }

  const preset = UPLOAD_PRESET_CONFIG[parsed.data.kind]
  const fileValidation = validateUploadFile(
    {
      name: parsed.data.fileName,
      size: parsed.data.fileSize,
      type: parsed.data.contentType,
    },
    preset.policy
  )

  if (!fileValidation.ok) {
    return invalid(fileValidation.message)
  }

  return {
    ok: true as const,
    value: {
      kind: parsed.data.kind as UploadPreset,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize,
      contentType: parsed.data.contentType,
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
    return { ok: false as const, status: 500, message: "Admin-Rolle konnte nicht geprüft werden." }
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
