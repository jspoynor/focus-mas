import { useAppStore } from '../../store/useAppStore'

/**
 * TODO(grill-me): Implement Pomodoro focus/break timer.
 * - Run focus sessions at the user's current stage length.
 * - Persist session start/end to Firestore on completion.
 * - Transition to PostSessionSurvey when a focus block ends.
 */
export function Timer() {
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const progress = useAppStore((s) => s.progress)

  return (
    <section
      className="glass-card glass-shine rounded-glass-lg p-6"
      aria-label="Focus timer"
    >
      <h2 className="text-lg font-medium text-white">Pomodoro timer</h2>
      <p className="mt-2 text-sm text-white/70">
        Stub — timer logic pending grill-me spec.
      </p>
      <dl className="mt-4 grid gap-2 text-left text-sm text-white/80">
        <div className="flex justify-between gap-4">
          <dt>Current stage</dt>
          <dd>{progress?.currentStageMinutes ?? 25} min</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Active session</dt>
          <dd>{activeSessionId ?? 'none'}</dd>
        </div>
      </dl>
    </section>
  )
}
