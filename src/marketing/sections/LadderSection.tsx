import { getStageLadder } from '../../lib/beltColors'
import { STAGE_INCREMENT, STREAK_TARGET } from '../../lib/mastery'

/**
 * The ladder is read straight out of `getStageLadder()`, so it cannot disagree with the
 * app. It must come before the calendar section: the calendar's belt colors mean nothing
 * until the reader has learned that cream is 25 minutes and espresso is 90.
 */
export function LadderSection() {
  const ladder = getStageLadder()
  const first = ladder[0]
  const last = ladder[ladder.length - 1]

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest text-white/40">The ladder</p>
      <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
        {STREAK_TARGET} clean sessions. {STAGE_INCREMENT} more minutes.
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60">
        Everyone starts at {first.minutes} minutes. Each rung is earned, and no rung is ever
        taken back. Get distracted and you keep the minutes you have — you just start the
        next climb from zero.
      </p>

      <div className="glass-card mt-12 rounded-glass-lg p-6 sm:p-8">
        <div className="flex items-end gap-1 sm:gap-1.5">
          {ladder.map((stage, index) => (
            <div key={stage.minutes} className="group flex min-w-0 flex-1 flex-col gap-2">
              <div
                className="rounded-sm transition-all duration-300 group-hover:opacity-80"
                style={{
                  backgroundColor: stage.color,
                  height: `${1.25 + (index / (ladder.length - 1)) * 3}rem`,
                }}
                aria-hidden="true"
              />
              <span className="truncate text-center text-[10px] tabular-nums text-white/40">
                {stage.minutes}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <span>{first.minutes} min · cream</span>
          <span>{last.minutes} min · espresso</span>
        </div>
      </div>
    </section>
  )
}
