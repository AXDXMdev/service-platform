"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { SITE_ASSET_POLICY, validateUploadFile } from "@/lib/mediaUpload"
import { toValidHttpUrls } from "@/lib/validation"
import { completeSignedUpload, requestSignedUpload } from "@/lib/authenticatedApi"
import { getAdminOverview } from "@/app/admin/adminOverviewApi"
import { postAdminCmsAction } from "@/app/admin/adminCmsApi"
import {
  buildApproveReviewAction,
  buildApproveVerificationAction,
  buildRejectVerificationAction,
  buildWaitlistStatusAction,
  postAdminModerationAction,
} from "@/app/admin/adminModerationApi"
import {
  defaultPageContents,
  defaultSiteSettings,
  defaultThemeSettings,
  type CmsCategory,
  type HomepageSection,
  type PageContent,
  type SiteSettings,
  type ThemeSettings,
} from "@/lib/siteSettings"
import {
  isMissingTable,
  type AuditEventRow,
  type PendingReviewRow,
  type ProviderRow,
  type ProviderVerificationRequestRow,
  type Role,
  type ServiceAdminRow,
  type WaitlistRow,
} from "@/app/admin/adminShared"
import { AdminAuditModule } from "@/app/admin/modules/AdminAuditModule"
import { AdminCategoriesModule, type NewCategoryDraft } from "@/app/admin/modules/AdminCategoriesModule"
import { AdminContentModule } from "@/app/admin/modules/AdminContentModule"
import { AdminDesignModule } from "@/app/admin/modules/AdminDesignModule"
import { AdminHomepageModule } from "@/app/admin/modules/AdminHomepageModule"
import { AdminPageContentModule } from "@/app/admin/modules/AdminPageContentModule"
import { AdminPreviewModule } from "@/app/admin/modules/AdminPreviewModule"
import { AdminReviewModerationModule } from "@/app/admin/modules/AdminReviewModerationModule"
import { AdminServicesOverviewModule } from "@/app/admin/modules/AdminServicesOverviewModule"
import { AdminVerificationModule } from "@/app/admin/modules/AdminVerificationModule"
import { AdminWaitlistModule } from "@/app/admin/modules/AdminWaitlistModule"

type SiteContentEntry = {
  key: string
  content: Record<string, unknown>
}

const emptyNewCategory: NewCategoryDraft = {
  slug: "",
  name: "",
  icon: "",
  description: "",
  color: "#356fe3",
}

export default function AdminCmsClient() {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings)
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([])
  const [categories, setCategories] = useState<CmsCategory[]>([])
  const [services, setServices] = useState<ServiceAdminRow[]>([])
  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [siteContent, setSiteContent] = useState<Record<string, Record<string, unknown>>>({})
  const [pageContents, setPageContents] = useState<PageContent[]>(defaultPageContents)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [previewPageSlug, setPreviewPageSlug] = useState("home")
  const [providerVerificationRequests, setProviderVerificationRequests] = useState<ProviderVerificationRequestRow[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReviewRow[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([])
  const [actorUserId, setActorUserId] = useState<string | null>(null)

  const [newCategory, setNewCategory] = useState<NewCategoryDraft>(emptyNewCategory)

  const isAdmin = role === "admin"
  const canEdit = isAdmin

  const footerContent = (siteContent.footer ?? {}) as Record<string, string>
  const helpContent = (siteContent.help ?? {}) as Record<string, string>
  const accessibilityContent = (siteContent.accessibility ?? {}) as Record<string, string>
  const previewPage = pageContents.find((page) => page.slug === previewPageSlug) ?? pageContents[0]

  const designPreviewStyle = useMemo(
    () =>
      ({
        backgroundColor: themeSettings.background_color,
        color: themeSettings.text_color,
        borderRadius: `${themeSettings.border_radius}px`,
      }) as React.CSSProperties,
    [themeSettings.background_color, themeSettings.border_radius, themeSettings.text_color]
  )

  const resetThemeDefaults = () => {
    setThemeSettings(defaultThemeSettings)
    setSiteSettings((current) => ({ ...current, default_theme_mode: "dark" }))
    setStatus("Design auf Defaults zurückgesetzt. Speichern übernimmt die Werte.")
  }

  const resetPageDefaults = () => {
    setPageContents(defaultPageContents)
    setStatus("Page-Inhalte auf Defaults zurückgesetzt. Speichern übernimmt die Werte.")
  }

  const patchThemeSettings = useCallback((patch: Partial<ThemeSettings>) => {
    setThemeSettings((current) => ({ ...current, ...patch }))
  }, [])

  const patchSiteSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSiteSettings((current) => ({ ...current, ...patch }))
  }, [])

  const patchHomepageSection = useCallback((sectionKey: string, enabled: boolean) => {
    setHomepageSections((current) =>
      current.map((item) => (item.key === sectionKey ? { ...item, enabled } : item))
    )
  }, [])

  const patchPageContent = useCallback((slug: string, patch: Partial<PageContent>) => {
    setPageContents((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item))
    )
  }, [])

  const patchNewCategory = useCallback((patch: Partial<NewCategoryDraft>) => {
    setNewCategory((current) => ({ ...current, ...patch }))
  }, [])

  const patchCategory = useCallback((categoryId: string, patch: Partial<CmsCategory>) => {
    setCategories((current) =>
      current.map((item) => (item.id === categoryId ? { ...item, ...patch } : item))
    )
  }, [])

  const patchSiteContentSection = useCallback(
    (section: "footer" | "help" | "accessibility", patch: Record<string, unknown>) => {
      setSiteContent((current) => ({
        ...current,
        [section]: { ...(current[section] ?? {}), ...patch },
      }))
    },
    []
  )

  const updateWaitlistStatusDraft = (entryId: string, nextStatus: string) => {
    setWaitlist((current) =>
      current.map((item) => (item.id === entryId ? { ...item, status: nextStatus } : item))
    )
  }

  const saveWaitlistStatus = useCallback(
    async (entry: WaitlistRow) => {
      if (!actorUserId) {
        setStatus("Admin-User fehlt. Bitte Admin-Seite neu laden.")
        return
      }
      try {
        const result = await postAdminModerationAction(buildWaitlistStatusAction(actorUserId, entry))
        setStatus(result.message)
      } catch (error) {
        setStatus(`Warteliste konnte nicht aktualisiert werden: ${String(error instanceof Error ? error.message : error)}`)
      }
    },
    [actorUserId]
  )

  const approveProviderVerification = useCallback(
    async (request: ProviderVerificationRequestRow) => {
      setStatus("")
      if (!actorUserId) {
        setStatus("Admin-User fehlt. Bitte Admin-Seite neu laden.")
        return
      }
      try {
        const result = await postAdminModerationAction(
          buildApproveVerificationAction(actorUserId, request)
        )
        setProviderVerificationRequests((current) =>
          current.map((item) => (item.id === request.id ? { ...item, status: "approved" } : item))
        )
        setStatus(result.message)
      } catch (error) {
        setStatus(`Verifizieren fehlgeschlagen: ${String(error instanceof Error ? error.message : error)}`)
      }
    },
    [actorUserId]
  )

  const rejectProviderVerification = useCallback(
    async (request: ProviderVerificationRequestRow) => {
      setStatus("")
      if (!actorUserId) {
        setStatus("Admin-User fehlt. Bitte Admin-Seite neu laden.")
        return
      }
      try {
        const result = await postAdminModerationAction(
          buildRejectVerificationAction(actorUserId, request)
        )
        setProviderVerificationRequests((current) =>
          current.map((item) => (item.id === request.id ? { ...item, status: "rejected" } : item))
        )
        setStatus(result.message)
      } catch (error) {
        setStatus(`Ablehnen fehlgeschlagen: ${String(error instanceof Error ? error.message : error)}`)
      }
    },
    [actorUserId]
  )

  const approveReviewProof = useCallback(
    async (review: PendingReviewRow) => {
      setStatus("")
      if (!actorUserId) {
        setStatus("Admin-User fehlt. Bitte Admin-Seite neu laden.")
        return
      }
      try {
        const result = await postAdminModerationAction(buildApproveReviewAction(actorUserId, review))
        setPendingReviews((current) => current.filter((item) => item.id !== review.id))
        setStatus(result.message)
      } catch (error) {
        setStatus(`Freigabe fehlgeschlagen: ${String(error instanceof Error ? error.message : error)}`)
      }
    },
    [actorUserId]
  )

  const logoutAll = useCallback(async () => {
    await fetch("/admin/session", { method: "DELETE" })
    await supabase.auth.signOut()
    router.replace("/admin/login")
    router.refresh()
  }, [router])

  const loadAll = useCallback(async () => {
    setStatus("")

    try {
      const overview = await getAdminOverview()

      setRole(overview.role)
      setActorUserId(overview.actorUserId)

      if (overview.siteSettings) {
        setSiteSettings({
          ...defaultSiteSettings,
          ...overview.siteSettings,
          trust_badges: overview.siteSettings.trust_badges ?? [],
          pilot_cities: overview.siteSettings.pilot_cities ?? [],
          notice_boxes: overview.siteSettings.notice_boxes ?? [],
        } as SiteSettings)
      }

      if (overview.themeSettings) {
        setThemeSettings({
          ...defaultThemeSettings,
          ...overview.themeSettings,
        } as ThemeSettings)
      }

      setHomepageSections(overview.homepageSections)
      setCategories(overview.categories)
      setServices(overview.services)
      setProviders(overview.providers)
      setWaitlist(overview.waitlist)
      setProviderVerificationRequests(overview.providerVerificationRequests)
      setPendingReviews(overview.pendingReviews)
      setAuditEvents(overview.auditEvents)

      setSiteContent(
        Object.fromEntries(
          overview.siteContentEntries.map((entry: SiteContentEntry) => [entry.key, entry.content ?? {}])
        )
      )

      if (overview.pageContents.length > 0) {
        const bySlug = new Map(defaultPageContents.map((page) => [page.slug, page]))
        const fromDb = overview.pageContents.map((page) => ({
          ...bySlug.get(page.slug),
          ...page,
        }))
        const missingDefaults = defaultPageContents.filter(
          (page) => !fromDb.some((dbPage) => dbPage.slug === page.slug)
        )
        setPageContents([...fromDb, ...missingDefaults])
      } else {
        setPageContents(defaultPageContents)
      }

      if (overview.warnings.length > 0) {
        const missingCms = overview.warnings.some((message) => isMissingTable(message))
        if (missingCms) {
          setStatus("CMS Tabellen fehlen teilweise. Bitte Migrationen prüfen.")
        }
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Admin-Daten konnten nicht geladen werden."
      )
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadAll().finally(() => setLoading(false))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [loadAll])

  const uploadSiteAsset = async (file: File) => {
    const validation = validateUploadFile(file, SITE_ASSET_POLICY)
    if (!validation.ok) {
      throw new Error(validation.message)
    }

    const uploadGrant = await requestSignedUpload({
      kind: "siteAsset",
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    })
    const upload = await supabase.storage.from(uploadGrant.bucket).uploadToSignedUrl(uploadGrant.path, uploadGrant.token, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    })
    if (upload.error) throw new Error(upload.error.message)
    await completeSignedUpload({
      bucket: uploadGrant.bucket,
      path: uploadGrant.path,
      fileSize: file.size,
      contentType: file.type,
    })
    return uploadGrant.publicUrl
  }

  const uploadLogoAsset = useCallback(
    async (file: File) => {
      try {
        const url = await uploadSiteAsset(file)
        setThemeSettings((current) => ({ ...current, logo_url: url }))
        setStatus("Logo erfolgreich hochgeladen.")
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${String(error)}`)
      }
    },
    []
  )

  const uploadHeroAsset = useCallback(
    async (file: File) => {
      try {
        const url = await uploadSiteAsset(file)
        setThemeSettings((current) => ({ ...current, hero_background_url: url }))
        setStatus("Hero Bild erfolgreich hochgeladen.")
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${String(error)}`)
      }
    },
    []
  )

  const saveDesign = useCallback(async () => {
    setStatus("")
    try {
      const themePayload = {
        ...themeSettings,
        logo_url: themeSettings.logo_url
          ? toValidHttpUrls(themeSettings.logo_url)[0] ?? themeSettings.logo_url
          : null,
        hero_background_url: themeSettings.hero_background_url
          ? toValidHttpUrls(themeSettings.hero_background_url)[0] ?? themeSettings.hero_background_url
          : null,
      }
      const result = await postAdminCmsAction({
        action: "saveDesign",
        payload: {
          themeSettings: themePayload,
          defaultThemeMode: siteSettings.default_theme_mode,
        },
      })
      setStatus(result.message)
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [siteSettings.default_theme_mode, themeSettings])

  const saveHomepage = useCallback(async () => {
    try {
      const result = await postAdminCmsAction({
        action: "saveHomepage",
        payload: { siteSettings, homepageSections },
      })
      setStatus(result.message)
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [homepageSections, siteSettings])

  const savePageContents = useCallback(async () => {
    try {
      const result = await postAdminCmsAction({
        action: "savePageContents",
        payload: { pageContents },
      })
      setStatus(result.message)
    } catch (error) {
      setStatus(`Page-Inhalte konnten nicht gespeichert werden: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [pageContents])

  const createCategory = useCallback(async () => {
    try {
      const result = await postAdminCmsAction({
        action: "createCategory",
        payload: {
          category: newCategory,
          sortOrder: categories.length + 10,
        },
      })
      setNewCategory(emptyNewCategory)
      await loadAll()
      setStatus(result.message)
    } catch (error) {
      setStatus(`Kategorie konnte nicht erstellt werden: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [categories.length, loadAll, newCategory])

  const saveCategory = useCallback(async (category: CmsCategory) => {
    try {
      const result = await postAdminCmsAction({
        action: "updateCategory",
        payload: { category },
      })
      setStatus(result.message)
    } catch (error) {
      setStatus(`Kategorie konnte nicht gespeichert werden: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [])

  const saveSiteContent = useCallback(async () => {
    try {
      const result = await postAdminCmsAction({
        action: "saveSiteContent",
        payload: { siteContent },
      })
      setStatus(result.message)
    } catch (error) {
      setStatus(`Content konnte nicht gespeichert werden: ${String(error instanceof Error ? error.message : error)}`)
    }
  }, [siteContent])

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="card-surface h-56 animate-pulse rounded-[14px]" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6 animate-float-up">
        <section className="card-surface rounded-[14px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold">Hilfinio Admin CMS</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Stabiler Admin-Login + CMS-Module (defensiv bei fehlenden Tabellen).
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                Rolle: {role ?? "unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="action-ghost" onClick={() => void loadAll()}>
                Aktualisieren
              </button>
              <button type="button" className="action-ghost" onClick={logoutAll}>
                Logout
              </button>
            </div>
          </div>

          {status && (
            <p className="mt-3 rounded-[8px] bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {status}
            </p>
          )}
          {!canEdit && (
            <p className="mt-3 rounded-[8px] bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              Moderator-Modus: Ansicht aktiv. Bearbeitung ist nur für Admins erlaubt.
            </p>
          )}
        </section>

        <AdminDesignModule
          canEdit={canEdit}
          themeSettings={themeSettings}
          defaultThemeMode={siteSettings.default_theme_mode}
          onThemePatch={patchThemeSettings}
          onDefaultThemeModeChange={(mode) => patchSiteSettings({ default_theme_mode: mode })}
          onUploadLogo={uploadLogoAsset}
          onUploadHero={uploadHeroAsset}
          onSave={saveDesign}
          onReset={resetThemeDefaults}
        />

        <AdminHomepageModule
          canEdit={canEdit}
          siteSettings={siteSettings}
          homepageSections={homepageSections}
          onSiteSettingsPatch={patchSiteSettings}
          onHomepageSectionToggle={patchHomepageSection}
          onSave={saveHomepage}
        />

        <AdminPreviewModule
          previewPageSlug={previewPageSlug}
          previewMode={previewMode}
          pageContents={pageContents}
          previewPage={previewPage}
          themeSettings={themeSettings}
          siteSettings={siteSettings}
          designPreviewStyle={designPreviewStyle}
          onPreviewPageSlugChange={setPreviewPageSlug}
          onPreviewModeChange={setPreviewMode}
        />

        <AdminPageContentModule
          canEdit={canEdit}
          pageContents={pageContents}
          onPagePatch={patchPageContent}
          onSave={savePageContents}
          onReset={resetPageDefaults}
        />

        <AdminCategoriesModule
          canEdit={canEdit}
          categories={categories}
          newCategory={newCategory}
          onNewCategoryPatch={patchNewCategory}
          onCreateCategory={createCategory}
          onCategoryPatch={patchCategory}
          onSaveCategory={saveCategory}
        />

        <AdminWaitlistModule
          canEdit={canEdit}
          waitlist={waitlist}
          onChangeStatus={updateWaitlistStatusDraft}
          onSaveStatus={saveWaitlistStatus}
        />

        <AdminVerificationModule
          canEdit={canEdit}
          requests={providerVerificationRequests}
          onApprove={approveProviderVerification}
          onReject={rejectProviderVerification}
        />

        <AdminReviewModerationModule
          canEdit={canEdit}
          reviews={pendingReviews}
          onApprove={approveReviewProof}
        />

        <AdminAuditModule auditEvents={auditEvents} />

        <AdminContentModule
          canEdit={canEdit}
          footerContent={footerContent}
          helpContent={helpContent}
          accessibilityContent={accessibilityContent}
          onSectionPatch={patchSiteContentSection}
          onSave={saveSiteContent}
        />

        <AdminServicesOverviewModule services={services} providers={providers} />
      </div>
    </main>
  )
}
