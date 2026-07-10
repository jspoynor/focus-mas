import { TimerDisplay } from '../../features/timer/TimerDisplay'
import { DemoStreakBar } from '../DemoStreakBar'
import { DEMO_STAGE_MINUTES, useDemoLoop } from '../demo/useDemoLoop'

export function Hero() {
  const loop = useDemoLoop()

  return (
    <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-12 px-6 py-20 lg:flex-row lg:items-center lg:gap-16">
      <div className="max-w-xl lg:flex-1">
        <p className="text-xs uppercase tracking-widest text-white/50">Focus Más</p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Your attention span is trainable.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-white/75">
          Most timers reward showing up. Focus Más rewards concentrating.
        </p>
        <p className="mt-4 text-base leading-relaxed text-white/60">
          Five clean sessions earn you five more minutes. One distracted session resets the
          streak. You never go backwards.
        </p>
      </div>

      <div className="w-full lg:flex-1">
        <div className="glass-card marketing-hero-panel rounded-glass-lg p-6 sm:p-8">
          <TimerDisplay
            compact
            modeLabel="Focus session"
            displaySeconds={loop.remainingSeconds}
            subLabel={`${DEMO_STAGE_MINUTES} min focus`}
          />

          <div className="mt-6 border-t border-white/10 pt-5">
            <DemoStreakBar streak={loop.streak} stageMinutes={DEMO_STAGE_MINUTES} />
          </div>
        </div>
      </div>
    </section>
  )
}
