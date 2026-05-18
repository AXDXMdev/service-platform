import { createHash } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import { getServerEnv } from "@/lib/env"
import { UPLOAD_PRESET_CONFIG, type UploadPreset } from "@/lib/mediaUpload"
import { logServerError, logServerWarn } from "@/lib/serverLogger"
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

type UploadProcessingJob = {
  id: string
  user_id: string | null
  bucket: "service-media" | "site-assets"
  object_path: string
  content_type: string
  file_size: number
  fingerprint: string
  status: "queued" | "processing" | "completed" | "failed" | "quarantined" | "duplicate"
  checks: Record<string, unknown> | null
  created_at: string
}

type UploadProcessingWorkerAdminClient = UploadProcessingAdminClient & {
  from(table: "upload_processing_jobs"): UploadProcessingJobsTable
}

type UploadProcessingJobsTable = {
  select(columns: string): {
    in(column: string, values: string[]): {
      order(column: string, options?: { ascending?: boolean }): {
        limit(limit: number): Promise<{ data: UploadProcessingJob[] | null; error: { message: string } | null }>
      }
    }
  }
  update(values: Record<string, unknown>): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<{ data: unknown | null; error: { message: string } | null }>
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

async function externalUploadCheck(
  url: string | null,
  token: string | null,
  payload: Record<string, unknown>
) {
  if (!url) return { configured: false as const, ok: false as const, reason: "not_configured" }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch((error) => {
    throw new Error(error instanceof Error ? error.message : String(error))
  })

  if (!response.ok) {
    return {
      configured: true as const,
      ok: false as const,
      reason: `http_${response.status}`,
    }
  }

  const body = (await response.json().catch(() => ({}))) as { ok?: boolean; status?: string; reason?: string }
  const accepted = body.ok !== false && body.status !== "infected" && body.status !== "rejected"
  return {
    configured: true as const,
    ok: accepted,
    reason: body.reason ?? body.status ?? (accepted ? "accepted" : "rejected"),
  }
}

async function markJob(
  admin: UploadProcessingWorkerAdminClient,
  job: UploadProcessingJob,
  status: UploadProcessingJob["status"],
  values: Record<string, unknown>
) {
  const update = await admin
    .from("upload_processing_jobs")
    .update({
      status,
      ...values,
      updated_at: new Date().toISOString(),
      ...(status === "completed" || status === "failed" || status === "quarantined"
        ? { processed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", job.id)
    .eq("status", job.status)

  if (update.error) {
    logServerWarn("Upload processing job update failed", {
      jobId: job.id,
      status,
      error: update.error.message,
    })
  }
}

async function loadStorageObject(admin: UploadProcessingWorkerAdminClient, job: UploadProcessingJob) {
  const fileName = job.object_path.split("/").pop() ?? ""
  const folder = job.object_path.slice(0, Math.max(0, job.object_path.length - fileName.length - 1))
  const listed = await admin.storage.from(job.bucket).list(folder, { limit: 100, search: fileName })
  if (listed.error) throw new Error(listed.error.message)
  return (listed.data ?? []).find((item) => item.name === fileName) ?? null
}

export async function processQueuedUploadJobs(
  admin: UploadProcessingWorkerAdminClient,
  options: { limit?: number } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 25)
  const env = getServerEnv()
  const result = await admin
    .from("upload_processing_jobs")
    .select("id,user_id,bucket,object_path,content_type,file_size,fingerprint,status,checks,created_at")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true })
    .limit(limit)

  if (result.error) {
    return { ok: false as const, status: 500, message: result.error.message }
  }

  const jobs = result.data ?? []
  const summary = {
    inspected: jobs.length,
    completed: 0,
    failed: 0,
    quarantined: 0,
    skipped: 0,
  }

  for (const job of jobs) {
    try {
      if (job.status === "queued") {
        await markJob(admin, job, "processing", { checks: { ...(job.checks ?? {}), workerStarted: true } })
      }

      const object = await loadStorageObject(admin, { ...job, status: "processing" })
      if (!object) {
        summary.failed += 1
        await markJob(admin, { ...job, status: "processing" }, "failed", {
          error_message: "storage_object_missing",
          checks: { ...(job.checks ?? {}), storageObjectFound: false },
        })
        continue
      }

      const storageMime = object.metadata?.mimetype?.toLowerCase() ?? job.content_type
      const storageSize = Number(object.metadata?.size ?? job.file_size)
      const policy = UPLOAD_PRESET_CONFIG[job.bucket === "service-media" ? "serviceMedia" : "siteAsset"].policy
      const violatesPolicy =
        !policy.allowedMimeTypes.includes(storageMime) ||
        !policy.allowedMimeTypes.includes(job.content_type) ||
        storageSize > policy.maxBytes ||
        storageSize <= 0

      if (violatesPolicy) {
        summary.quarantined += 1
        await markJob(admin, { ...job, status: "processing" }, "quarantined", {
          error_message: "storage_metadata_policy_violation",
          checks: {
            ...(job.checks ?? {}),
            storageObjectFound: true,
            storageMime,
            storageSize,
            quarantineReason: "metadata_policy_violation",
          },
        })
        continue
      }

      const scanPayload = {
        bucket: job.bucket,
        objectPath: job.object_path,
        contentType: job.content_type,
        fileSize: job.file_size,
        fingerprint: job.fingerprint,
      }
      const av = await externalUploadCheck(env.UPLOAD_AV_SCAN_URL, env.UPLOAD_AV_SCAN_TOKEN, scanPayload)
      const sanitizer = job.content_type.startsWith("image/")
        ? await externalUploadCheck(env.UPLOAD_IMAGE_SANITIZER_URL, env.UPLOAD_IMAGE_SANITIZER_TOKEN, scanPayload)
        : { configured: true as const, ok: true as const, reason: "not_required" }

      if (!av.configured || !sanitizer.configured) {
        summary.failed += 1
        await markJob(admin, { ...job, status: "processing" }, "failed", {
          error_message: "upload_security_processors_not_configured",
          checks: {
            ...(job.checks ?? {}),
            storageObjectFound: true,
            avScanConfigured: av.configured,
            imageSanitizerConfigured: sanitizer.configured,
            avScanReason: av.reason,
            imageSanitizerReason: sanitizer.reason,
          },
        })
        continue
      }

      if (!av.ok || !sanitizer.ok) {
        summary.quarantined += 1
        await markJob(admin, { ...job, status: "processing" }, "quarantined", {
          error_message: !av.ok ? "av_scan_rejected" : "image_sanitizer_rejected",
          checks: {
            ...(job.checks ?? {}),
            storageObjectFound: true,
            avScanPassed: av.ok,
            avScanReason: av.reason,
            imageSanitizerPassed: sanitizer.ok,
            imageSanitizerReason: sanitizer.reason,
          },
        })
        continue
      }

      summary.completed += 1
      await markJob(admin, { ...job, status: "processing" }, "completed", {
        checks: {
          ...(job.checks ?? {}),
          storageObjectFound: true,
          storageMime,
          storageSize,
          avScanPassed: true,
          imageSanitizerPassed: sanitizer.ok,
          completedBy: "hilfinio-upload-worker",
        },
      })
    } catch (error) {
      summary.failed += 1
      logServerError("Upload processing job failed", {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      })
      await markJob(admin, { ...job, status: "processing" }, "failed", {
        error_message: error instanceof Error ? error.message.slice(0, 500) : "unknown_error",
      })
    }
  }

  return { ok: true as const, data: summary }
}
