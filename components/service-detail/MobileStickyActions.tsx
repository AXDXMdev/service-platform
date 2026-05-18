type MobileStickyActionsProps = {
  isFavorite: boolean
  sending?: boolean
  onFavorite: () => void
}

export default function MobileStickyActions({
  isFavorite,
  sending = false,
  onFavorite,
}: MobileStickyActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--surface-border)] bg-white/95 px-4 py-3 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur-md dark:bg-slate-950/95 lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto_auto] gap-2">
        <a
          href="#anfrage"
          className="btn-primary min-h-12 justify-center rounded-[10px] px-4 py-3 text-sm font-semibold text-white"
        >
          {sending ? "Sendet..." : "Anfrage senden"}
        </a>
        <a
          href="#anbieter"
          className="btn-secondary min-h-12 justify-center rounded-[10px] px-3 py-3 text-sm font-semibold"
        >
          Kontakt
        </a>
        <button
          type="button"
          onClick={onFavorite}
          className="btn-secondary min-h-12 rounded-[10px] px-3 py-3 text-sm font-semibold"
          aria-pressed={isFavorite}
        >
          {isFavorite ? "Gemerkt" : "Merken"}
        </button>
      </div>
    </div>
  )
}
