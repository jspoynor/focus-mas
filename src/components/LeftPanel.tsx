import { useMemo, useState } from 'react'
import {
  acceptStepBackOffer,
  declineStepBackOffer,
} from '../features/mastery/runMasteryEngine'
import {
  ADVANCEMENT_THRESHOLD,
  buildingProgressPercent,
  computeRollingWindow,
  formatMasteryPercent,
  WINDOW_MINUTES,
} from '../lib/mastery'
import { useAppStore } from '../store/useAppStore'

export function LeftPanel() {
  const userId = useAppStore((s) => s.userId)
  const progress = useAppStore((s) => s.progress)
  const sessions = useAppStore((s) => s.sessions)
  const pendingStepBackTargetMinutes = useAppStore((s) => s.pendingStepBackTargetMinutes)

  const [isRespondingToStepBack, setIsRespondingToStepBack] = useState(false)

  const mastery = useMemo(() => {
    const window = computeRollingWindow(sessions)
    return {
      window,
      buildingPercent: buildingProgressPercent(window.totalMinutes),
    }
  }, [sessions])

  const stageMinutes = progress?.currentStageMinutes ?? 25

  async function handleAcceptStepBack() {
    if (!userId) return
    setIsRespondingToStepBack(true)
    try {
      await acceptStepBackOffer(userId)
    } catch (err) {
      console.warn('[mastery] Failed to accept step back:', err)
    } finally {
      setIsRespondingToStepBack(false)
    }
  }

  async function handleDeclineStepBack() {
    if (!userId) return
    setIsRespondingToStepBack(true)
    try {
      await declineStepBackOffer(userId)
    } catch (err) {
      console.warn('[mastery] Failed to decline step back:', err)
    } finally {
      setIsRespondingToStepBack(false)
    }
  }

  return (
    <section
      className="glass-panel min-h-0 overflow-hidden rounded-glass-lg p-6 max-lg:flex-1"
      aria-label="Mastery insights"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Current stage</p>
          <p className="mt-1 text-2xl font-light text-white">{stageMinutes} min</p>
        </div>

        {!mastery.window.isFull ? (
          <div>
            <p className="text-sm font-medium text-white/90">Building...</p>
            <p className="mt-1 text-xs text-white/60">
              {mastery.window.totalMinutes} / {WINDOW_MINUTES} min of focus history
            </p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={mastery.buildingPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress toward first mastery window"
            >
              <div
                className="h-full rounded-full bg-emerald-400/80 transition-all duration-500"
                style={{ width: `${mastery.buildingPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/50">
              Complete more sessions to unlock mastery tracking.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">Clean rate</p>
            <p className="mt-1 text-2xl font-light text-white">
              {formatMasteryPercent(mastery.window.cleanRate)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {mastery.window.cleanCount} clean of {mastery.window.sessionCount} sessions in
              window
            </p>
            {mastery.window.cleanRate >= ADVANCEMENT_THRESHOLD ? (
              <p className="mt-3 text-sm text-emerald-300/90">
                You&apos;re meeting the {Math.round(ADVANCEMENT_THRESHOLD * 100)}% threshold —
                advancing when the window stays full.
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/70">
                Reach {Math.round(ADVANCEMENT_THRESHOLD * 100)}% clean sessions in your rolling
                window to advance to the next stage.
              </p>
            )}
          </div>
        )}
      </div>

      {pendingStepBackTargetMinutes !== null ? (
        <div
          className="ui-surface mt-6 rounded-glass p-4"
          role="region"
          aria-label="Step back offer"
        >
          <p className="text-sm text-white/90">
            Your recent sessions suggest this length might be a stretch. Want to step back to{' '}
            {pendingStepBackTargetMinutes} min?
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleAcceptStepBack()}
              disabled={isRespondingToStepBack}
              className="glass-btn flex-1 rounded-glass px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Step back
            </button>
            <button
              type="button"
              onClick={() => void handleDeclineStepBack()}
              disabled={isRespondingToStepBack}
              className="glass-btn flex-1 rounded-glass px-3 py-2 text-sm text-white/80 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Keep current
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
