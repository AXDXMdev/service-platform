"use client"

import Image from "next/image"
import Link from "next/link"
import type { Service } from "@/app/types"
import { ServiceCategoryIcon } from "@/app/serviceIcons"
import { getServiceCategory } from "@/app/serviceCatalog"
import { useLanguage } from "@/components/LanguageProvider"

type ServiceListingCardProps = {
  service: Service
  categoryLabel: string
  distanceLabel?: string | null
  ratingAverage?: number | null
  ratingCount?: number
}

function isVideoMedia(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)
}

export default function ServiceListingCard({
  service,
  categoryLabel,
  distanceLabel,
  ratingAverage = null,
  ratingCount = 0,
}: ServiceListingCardProps) {
  const { t } = useLanguage()
  const category = getServiceCategory(service)
  const firstMedia = service.media_urls?.[0] ?? null

  return (
    <article className="card-surface interactive-card flex h-full min-w-0 flex-col overflow-hidden rounded-[12px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="icon-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-white">
          <ServiceCategoryIcon slug={category.slug} className="h-5 w-5" />
        </div>
        <span className="max-w-[70%] truncate rounded-full bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          {categoryLabel}
        </span>
      </div>

      {firstMedia && !isVideoMedia(firstMedia) && (
        <div className="mt-4 overflow-hidden rounded-[10px] border border-[var(--surface-border)] bg-[var(--surface-muted)]">
          <Image
            src={firstMedia}
            alt={service.title}
            width={1200}
            height={720}
            loading="lazy"
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      <h3 className="mt-4 line-clamp-2 break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
        {service.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-500/10 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300">
          {service.city
            ? `${service.city}${service.district ? `, ${service.district}` : ""}`
            : t("serviceCardLocationUnknown")}
        </span>
        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300">
          {t("serviceCardPriceFrom")}: {service.price_from_eur ? `${service.price_from_eur} EUR` : t("serviceCardOnRequest")}
        </span>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-300">
          {t("serviceCardRating")}: {ratingAverage != null ? `${ratingAverage}/5 (${ratingCount})` : t("serviceCardNew")}
        </span>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
          {service.is_verified ? t("serviceCardVerified") : t("serviceCardPending")}
        </span>
        {distanceLabel && (
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 font-semibold text-violet-700 dark:text-violet-300">
            {distanceLabel}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {service.description || t("serviceCardDetailsSoon")}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Link
          href={`/service/${service.id}#anfrage`}
          className="btn-primary min-h-11 justify-center rounded-[10px] px-3 py-2 text-center text-sm font-semibold text-white"
        >
          {t("serviceCardRequest")}
        </Link>
        <Link
          href={`/service/${service.id}`}
          className="btn-secondary min-h-11 justify-center rounded-[10px] px-3 py-2 text-center text-sm font-semibold"
        >
          {t("serviceCardDetails")}
        </Link>
      </div>
    </article>
  )
}
