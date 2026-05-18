import Image from "next/image"
import { ServiceCategoryIcon } from "@/app/serviceIcons"

type ServiceHeroGalleryProps = {
  title: string
  categorySlug: string
  mediaUrls?: string[] | null
}

function isVideoMedia(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)
}

export default function ServiceHeroGallery({
  title,
  categorySlug,
  mediaUrls,
}: ServiceHeroGalleryProps) {
  const media = mediaUrls?.filter(Boolean).slice(0, 5) ?? []
  const firstMedia = media[0]

  return (
    <section className="overflow-hidden rounded-[14px] border border-[var(--surface-border)] bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] dark:bg-slate-950">
      <div className="relative aspect-[4/3] bg-[var(--surface-muted)] sm:aspect-[16/9] lg:aspect-[5/4]">
        {firstMedia ? (
          isVideoMedia(firstMedia) ? (
            <video
              src={firstMedia}
              controls
              preload="metadata"
              className="h-full w-full bg-black object-cover"
            />
          ) : (
            <Image
              src={firstMedia}
              alt={title}
              width={1600}
              height={1200}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-slate-600 dark:text-slate-300">
            <div className="icon-chip grid h-16 w-16 place-items-center rounded-[14px] text-white">
              <ServiceCategoryIcon slug={categorySlug} className="h-7 w-7" />
            </div>
            <p className="max-w-xs text-sm font-semibold">
              Bilder folgen. Der Anbieter kann Arbeitsbeispiele nach der Verifizierung ergaenzen.
            </p>
          </div>
        )}
      </div>
      {media.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-[var(--surface-border)] p-2">
          {media.slice(1).map((url) => (
            <div
              key={url}
              className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[10px] bg-[var(--surface-muted)]"
            >
              {isVideoMedia(url) ? (
                <video src={url} preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={url}
                  alt={`${title} Arbeitsbeispiel`}
                  width={280}
                  height={200}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
