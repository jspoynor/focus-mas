function PanelSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <section className="glass-panel min-h-0 flex-1 overflow-hidden rounded-glass-lg p-6 max-lg:flex-1" aria-hidden="true">
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
      className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden lg:grid lg:h-full lg:grid-cols-[minmax(0,0.48fr)_minmax(0,2.24fr)_minmax(0,0.48fr)] lg:grid-rows-1 lg:items-stretch lg:gap-6"
      role="status"
      aria-label="Loading your focus data"
    >
      <div className="flex min-h-0 max-lg:flex-1 flex-col lg:py-4">
        <PanelSkeleton />
      </div>
      <TimerSkeleton />
      <div className="flex min-h-0 max-lg:flex-[1.5] flex-col lg:py-4">
        <PanelSkeleton lines={4} />
      </div>
    </div>
  )
}
