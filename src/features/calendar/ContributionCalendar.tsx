/**
 * TODO(grill-me): GitHub-style contribution calendar.
 * - Each day's cell opacity = % of that day's focus sessions completed without distraction.
 * - Surface projected progression date from mastery engine.
 */
export function ContributionCalendar() {
  return (
    <section
      className="glass-card-elevated rounded-glass-lg p-6"
      aria-label="Contribution calendar"
    >
      <h2 className="text-lg font-medium text-white">Contribution calendar</h2>
      <p className="mt-2 text-sm text-white/70">
        Stub — calendar grid and opacity math pending grill-me spec.
      </p>
      <div
        className="mt-4 grid grid-cols-7 gap-1 opacity-40"
        aria-hidden="true"
      >
        {Array.from({ length: 28 }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm bg-emerald-400/30"
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-white/60">
        Projected progression date: TBD
      </p>
    </section>
  )
}
