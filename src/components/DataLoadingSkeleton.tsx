function PanelSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <section className="glass-panel min-h-0 flex-1 overflow-hidden rounded-glass-lg p-6" aria-hidden="true">
      <div className="space-y-4">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded bg-white/10"
            style={{ width: `${72 - index * 12}%` }}
          />
        ))}
        <div className="mt-6 h-24 animate-pulse rounded-glass bg-white/5" />
      </div>
    </section>
  )
}

function TimerSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-8" aria-hidden="true">
      <div className="h-20 w-56 animate-pulse rounded-glass bg-white/10" />
      <div className="h-12 w-36 animate-pulse rounded-full bg-white/10" />
    </div>
  )
}

export function DataLoadingSkeleton() {
  return (
    <div
      className="app-main-layout min-h-0 w-full flex-1 gap-4 overflow-hidden lg:gap-6"
      role="status"
      aria-label="Loading your focus data"
    >
      <div className="app-main-layout__left flex min-h-0 flex-col">
        <PanelSkeleton />
      </div>
      <div className="app-main-layout__center">
        <TimerSkeleton />
      </div>
      <div className="app-main-layout__right flex min-h-0 flex-col">
        <PanelSkeleton lines={4} />
      </div>
    </div>
  )
}
