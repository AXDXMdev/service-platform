"use client"

import { useSiteSettings } from "@/components/SiteSettingsProvider"
import type { PageContent } from "@/lib/siteSettings"

type PageContentHeaderProps = {
  slug: string
  fallbackTitle: string
  fallbackSubtitle?: string
}

export default function PageContentHeader({
  slug,
  fallbackTitle,
  fallbackSubtitle,
}: PageContentHeaderProps) {
  const { content } = useSiteSettings()
  const pageContent = content[`page:${slug}`] as Partial<PageContent> | undefined
  const title = pageContent?.is_active === false ? fallbackTitle : pageContent?.title || fallbackTitle
  const subtitle =
    pageContent?.is_active === false ? fallbackSubtitle : pageContent?.subtitle || fallbackSubtitle

  return (
    <>
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
          {subtitle}
        </p>
      )}
    </>
  )
}
