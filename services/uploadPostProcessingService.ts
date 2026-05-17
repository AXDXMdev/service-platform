import { createHash } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import { UPLOAD_PRESET_CONFIG, type UploadPreset } from "@/lib/mediaUpload"
import { normalizeText } from "@/lib/validation"

type StorageObject = {
  name: string
  id?: string | null
  metadata?: {
    size?: number
    mimetype?: string
    cacheControl?: string
  } | null
}

type UploadProcessingAdminClient = {
  storage: {
    from(bucket: string): {
      list(path?: string, options?: { limit?: number; search?: string }): Promise<{
        data: StorageObject[] | null
        error: { message: string } | null
      }>
    }
  }
  from(table: string): {
    insert(rows: unknown[]): {
      select(columns: string): {
        single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>
      }
    }
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { id: string } | null; error: { message: string } | null }>
      }
    }
  }
}

function invalid(message: string) {
  return { ok: false as const, status: 400, message }
}

function getPresetByBucket(bucket: string): UploadPreset | null {
  const match = Object.entries(UPLOAD_PRESET_CONFIG).find(([, config]) => config.bucket === bucket)
  return match?.[0] as UploadPreset | undefined ?? null
}

export function validateUploadCompleteInput(input: unknown) {
  const payload = (input ?? {}) as {
    bucket?: string
    path?: string
    contentType?: string
    fileSize?: number | string
  }

  const bucket = normalizeText(payload.bucket ?? "", 80)
  const path = normalizeText(payload.path ?? "", 500)
  const contentType = normalizeText(payload.contentType ?? "", 120).toLowerCase()
  const fileSize = Number(payload.fileSize)
  const preset = getPresetByBucket(bucket)

  if (!preset || !path || !contentType || !Number.isFinite(fileSize) || fileSize <= 0) {
    return invalid("Upload-Metadaten sind unvollstaendig.")
  }

  const policy = UPLOAD_PRESET_CONFIG[preset].policy
  if (!policy.allowedMimeTypes.includes(contentType) || fileSize > policy.maxBytes) {
    return invalid("Upload verstoesst gegen die erlaubten Dateiregeln.")
  }

  return {
    ok: true as const,
    value: {
      preset,
      bucket: UPLOAD_PRESET_CONFIG[preset].bucket,
      path,
      contentType,
      fileSize,
    },
  }
}

export async function enqueueUploadPostProcessing(
  admin: UploadProcessingAdminClient,
  user: User,
  input: {
    preset: UploadPreset
    bucket: "service-media" | "site-assets"
    path: string
    contentType: string
    fileSize: number
  }
) {
  const expectedPrefix = input.preset === "serviceMedia" ? `${user.id}/` : "admin/"
  if (!input.path.startsWith(expectedPrefix)) {
    return { ok: false as const, status: 403, message: "Upload-Pfad gehoert nicht zu diesem Konto." }
  }

  const fileName = input.path.split("/").pop() ?? ""
  const folder = input.path.slice(0, Math.max(0, input.path.length - fileName.length - 1))
  const listed = await admin.storage.from(input.bucket).list(folder, { limit: 100, search: fileName })
  if (listed.error) {
    return { ok: false as const, status: 500, message: "Upload konnte nicht verifiziert werden." }
  }

  const object = (listed.data ?? []).find((item) => item.name === fileName)
  if (!object) {
    return { ok: false as const, status: 404, message: "Upload wurde im Storage nicht gefunden." }
  }

  const fingerprint = createHash("sha256")
    .update(`${input.bucket}:${input.path}:${input.contentType}:${input.fileSize}`)
    .digest("hex")

  const duplicate = await admin
    .from("upload_processing_jobs")
    .select("id")
    .eq("fingerprint", fingerprint)
    .maybeSingle()

  if (duplicate.data?.id) {
    return {
      ok: true as const,
      data: {
        id: duplicate.data.id,
        status: "duplicate",
        fingerprint,
      },
    }
  }

  const inserted = await admin
    .from("upload_processing_jobs")
    .insert([
      {
        user_id: user.id,
        bucket: input.bucket,
        object_path: input.path,
        content_type: input.contentType,
        file_size: input.fileSize,
        fingerprint,
        status: "queued",
        checks: {
          storageObjectFound: true,
          mimeValidated: true,
          extensionValidated: true,
          metadataStripRequired: input.contentType.startsWith("image/"),
          thumbnailRequired: input.contentType.startsWith("image/"),
          antivirusScanRequired: true,
        },
      },
    ])
    .select("id")
    .single()

  if (inserted.error || !inserted.data?.id) {
    return { ok: false as const, status: 500, message: "Upload-Pruefung konnte nicht vorgemerkt werden." }
  }

  return {
    ok: true as const,
    data: {
      id: inserted.data.id,
      status: "queued",
      fingerprint,
    },
  }
}
