export default function Loading() {
  return (
    <main className="min-h-[70vh] px-6 py-16 sm:px-10 lg:px-12">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 w-full max-w-xl animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-4/5 max-w-xl animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-3 pt-4">
            <div className="h-11 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-11 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950"
            />
          ))}
        </div>
      </section>
    </main>
  )
}
