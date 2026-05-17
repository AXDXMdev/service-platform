"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { roundCoords } from "@/app/location"
import { PILOT_MODE_ENABLED, isPilotCity, pilotCityLabel } from "@/lib/pilotMode"
import { useLanguage } from "@/components/LanguageProvider"
import {
  authenticatedFetch,
  completeSignedUpload,
  readApiErrorMessage,
  requestSignedUpload,
} from "@/lib/authenticatedApi"
import {
  SERVICE_MEDIA_POLICY,
  validateUploadSelection,
} from "@/lib/mediaUpload"
import { normalizeText } from "@/lib/validation"

const AVAILABILITY_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export default function CreateService() {
  const { t } = useLanguage()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [providerName, setProviderName] = useState("")
  const [providerBio, setProviderBio] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [yearsExperience, setYearsExperience] = useState("")
  const [serviceRadiusKm, setServiceRadiusKm] = useState("20")
  const [approxLat, setApproxLat] = useState<number | null>(null)
  const [approxLng, setApproxLng] = useState<number | null>(null)
  const [isVolunteer, setIsVolunteer] = useState(false)
  const [supportsSignLanguage, setSupportsSignLanguage] = useState(false)
  const [textChatOnly, setTextChatOnly] = useState(false)
  const [barrierFreeSupport, setBarrierFreeSupport] = useState(false)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([])
  const [availabilityNote, setAvailabilityNote] = useState("")

  const onMediaChange = (files: FileList | null) => {
    if (!files) {
      setMediaFiles([])
      return
    }

    const selected = Array.from(files)
    const result = validateUploadSelection(selected, SERVICE_MEDIA_POLICY)

    if (result.rejected.length > 0) {
      setMessage(result.rejected[0])
    } else {
      setMessage("")
    }

    setMediaFiles(result.accepted)
  }

  const uploadMediaFiles = async () => {
    if (mediaFiles.length === 0) return [] as string[]

    const urls: string[] = []

    for (const file of mediaFiles) {
      const uploadGrant = await requestSignedUpload({
        kind: "serviceMedia",
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      })

      const uploadResult = await supabase.storage
        .from(uploadGrant.bucket)
        .uploadToSignedUrl(uploadGrant.path, uploadGrant.token, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        })

      if (uploadResult.error) {
        throw uploadResult.error
      }

      await completeSignedUpload({
        bucket: uploadGrant.bucket,
        path: uploadGrant.path,
        fileSize: file.size,
        contentType: file.type,
      })

      urls.push(uploadGrant.publicUrl)
    }

    return urls
  }

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setMessage("Standortfreigabe wird auf diesem Gerät nicht unterstützt.")
      return
    }

    setCapturingLocation(true)
    setMessage("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const rounded = roundCoords(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          2
        )
        setApproxLat(rounded.lat)
        setApproxLng(rounded.lng)
        setCapturingLocation(false)
      },
      () => {
        setMessage("Standort konnte nicht abgerufen werden.")
        setCapturingLocation(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
      }
    )
  }

  const createService = async () => {
    setMessage("")

    if (!title.trim() || !description.trim() || !providerName.trim() || !city.trim()) {
      setMessage("Bitte Titel, Beschreibung, Anbietername und Stadt ausfüllen.")
      return
    }

    const cleanTitle = normalizeText(title, 120)
    const cleanDescription = normalizeText(description, 2000)
    const cleanProviderName = normalizeText(providerName, 100)
    const cleanCity = normalizeText(city, 80)
    const cleanDistrict = normalizeText(district, 80)
    const cleanProviderBio = normalizeText(providerBio, 1000)
    const cleanAvailabilityNote = normalizeText(availabilityNote, 200)

    const cityInPilot = isPilotCity(city)
    if (PILOT_MODE_ENABLED && !cityInPilot) {
      setMessage(
        `${t("pilotOnlyHint")} (Pilot-Staedte: ${pilotCityLabel()}). Bitte nutze die Warteliste, wenn wir dich zum Start informieren sollen.`
      )
      return
    }

    const payload = {
      title: cleanTitle,
      description: cleanDescription,
      provider_name: cleanProviderName,
      city: cleanCity,
      district: cleanDistrict || null,
      provider_bio: cleanProviderBio || null,
      years_experience: yearsExperience ? Math.min(Number(yearsExperience), 80) : null,
      service_radius_km: serviceRadiusKm ? Math.min(Number(serviceRadiusKm), 250) : null,
      approx_lat: approxLat,
      approx_lng: approxLng,
      is_volunteer: isVolunteer,
      supports_sign_language: supportsSignLanguage,
      text_chat_only: textChatOnly,
      barrier_free_support: barrierFreeSupport,
      media_urls: [] as string[],
      availability_days: availabilityDays,
      availability_note: cleanAvailabilityNote || null,
    }

    setSaving(true)
    try {
      payload.media_urls = await uploadMediaFiles()
    } catch (uploadError) {
      const errorMessage =
        uploadError instanceof Error ? uploadError.message : String(uploadError)
      if (/login erforderlich|unauthorized|authorization/i.test(errorMessage)) {
        router.push("/login")
        return
      }
      if (/bucket|storage|service-media|permission|policy|row-level|RLS/i.test(errorMessage)) {
        setMessage(
          "Medien-Upload ist noch nicht aktiv. Bitte Supabase-Migration für Storage ausführen."
        )
      } else {
        setMessage(`Upload fehlgeschlagen: ${errorMessage}`)
      }
      setSaving(false)
      return
    }

    const response = await authenticatedFetch("/api/providers/services", {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        providerName: payload.provider_name,
        providerBio: payload.provider_bio,
        city: payload.city,
        district: payload.district,
        yearsExperience: payload.years_experience,
        serviceRadiusKm: payload.service_radius_km,
        approxLat: payload.approx_lat,
        approxLng: payload.approx_lng,
        isVolunteer: payload.is_volunteer,
        supportsSignLanguage: payload.supports_sign_language,
        textChatOnly: payload.text_chat_only,
        barrierFreeSupport: payload.barrier_free_support,
        mediaUrls: payload.media_urls,
        availabilityDays: payload.availability_days,
        availabilityNote: payload.availability_note,
      }),
    })
    setSaving(false)

    if (!response.ok) {
      if (response.status === 401) {
        router.push("/login")
        return
      }
      setMessage(await readApiErrorMessage(response))
      return
    }

    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-2xl animate-float-up">
        <section className="card-surface rounded-[14px] p-7">
          <h1 className="text-3xl font-semibold">Service erstellen</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Je ausführlicher dein Profil, desto besser passende Anfragen bekommst du.
          </p>
          {PILOT_MODE_ENABLED && (
            <p className="mt-2 rounded-[8px] bg-blue-500/10 px-3 py-2 text-sm text-blue-800 dark:text-blue-300">
              {t("pilotBannerTitle")}: {pilotCityLabel()}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {message}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              className="field-input min-h-12 rounded-[10px] px-4 sm:col-span-2"
              placeholder="Titel (z. B. Umzugshilfe am Wochenende)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Name oder Firma"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Stadt"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Stadtteil (optional)"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Jahre Erfahrung"
              inputMode="numeric"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value.replace(/[^0-9]/g, ""))}
            />

            <input
              className="field-input min-h-12 rounded-[10px] px-4"
              placeholder="Einsatzradius (km)"
              inputMode="numeric"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(e.target.value.replace(/[^0-9]/g, ""))}
            />

            <textarea
              className="field-input min-h-24 rounded-[10px] px-4 py-3 sm:col-span-2"
              placeholder="Kurzprofil als Anbieter"
              value={providerBio}
              onChange={(e) => setProviderBio(e.target.value)}
            />

            <textarea
              className="field-input min-h-28 rounded-[10px] px-4 py-3 sm:col-span-2"
              placeholder="Leistungsbeschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="panel-muted rounded-[10px] p-3 sm:col-span-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Verfügbarkeit
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABILITY_DAYS.map((day) => {
                  const active = availabilityDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                        active
                          ? "bg-[var(--brand)] text-white"
                          : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      }`}
                      onClick={() =>
                        setAvailabilityDays((current) =>
                          current.includes(day)
                            ? current.filter((item) => item !== day)
                            : [...current, day]
                        )
                      }
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <input
                className="field-input mt-2 min-h-11 w-full rounded-[8px] px-3 text-sm"
                placeholder="z. B. werktags ab 18:00 Uhr"
                value={availabilityNote}
                onChange={(event) => setAvailabilityNote(event.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Arbeitsbeispiele (Fotos/Videos, bis zu 6 Dateien)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.m4v,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v"
                multiple
                onChange={(event) => onMediaChange(event.target.files)}
                className="field-input min-h-12 w-full rounded-[10px] px-4 py-2"
              />
              {mediaFiles.length > 0 && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {mediaFiles.length} Datei(en) ausgewählt.
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Erlaubt sind JPG, PNG, WEBP, GIF sowie MP4, WEBM, MOV und M4V. Maximal 6 Dateien, jeweils bis 50 MB.
              </p>
            </div>
          </div>

          <div className="panel-muted mt-4 rounded-[10px] p-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Inklusive Optionen
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  checked={isVolunteer}
                  onChange={(e) => setIsVolunteer(e.target.checked)}
                />
                <span>Ehrenamtliche Hilfe (kostenfrei)</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  checked={barrierFreeSupport}
                  onChange={(e) => setBarrierFreeSupport(e.target.checked)}
                />
                <span>Geeignet für Menschen mit Handicap</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  checked={supportsSignLanguage}
                  onChange={(e) => setSupportsSignLanguage(e.target.checked)}
                />
                <span>Gebärdensprache möglich</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  checked={textChatOnly}
                  onChange={(e) => setTextChatOnly(e.target.checked)}
                />
                <span>Kommunikation ohne Telefon (Chat/Text)</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={captureLocation}
              disabled={capturingLocation}
              className="rounded-[10px] border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {capturingLocation ? "Standort wird geholt..." : "Groben Standort erfassen"}
            </button>
            {approxLat !== null && approxLng !== null && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Grob gespeichert: {approxLat}, {approxLng}
              </p>
            )}
          </div>

          <button
            className="mt-5 w-full rounded-[10px] bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={createService}
          >
            {saving ? "Speichere..." : "Speichern"}
          </button>
        </section>
      </div>
    </main>
  )
}
