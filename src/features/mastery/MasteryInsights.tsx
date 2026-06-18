import { useMemo, useState } from 'react'
import {
  acceptStepBackOffer,
  declineStepBackOffer,
} from './runMasteryEngine'
import {
  ADVANCEMENT_THRESHOLD,
  buildingProgressPercent,
  computeRollingWindow,
  formatMasteryPercent,
  WINDOW_MINUTES,
} from '../../lib/mastery'
import { useAppStore } from '../../store/useAppStore'
import { getStageColor } from '../../lib/beltColors'

export function MasteryStage() {
  const progress = useAppStore((s) => s.progress)
  const stageMinutes = progress?.currentStageMinutes ?? 25
  const stageColor = getStageColor(stageMinutes)

  return (
    <div className="shrink-0">
      <p className="text-[10px] uppercase tracking-widest text-white/40">Mastery level</p>
      <p
        className="text-xl font-light transition-colors duration-500"
        style={{ color: stageColor }}
      >
        {stageMinutes} min
      </p>
    </div>
  )
}

export function MasteryDetails() {
  const userId = useAppStore((s) => s.userId)
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

  const thresholdPercent = Math.round(ADVANCEMENT_THRESHOLD * 100)

  return (
    <div className="shrink-0 space-y-3 border-t border-white/10 pt-3">
      {!mastery.window.isFull ? (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-white/70">Building window</p>
            <p className="text-[10px] text-white/50">
              {mastery.window.totalMinutes} / {WINDOW_MINUTES} min
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={mastery.buildingPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward mastery window"
          >
            <div
              className="h-full rounded-full bg-emerald-400/80 transition-all duration-500"
              style={{ width: `${mastery.buildingPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {mastery.window.isFull ? (
        <div className="space-y-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Uninterrupted rate</p>
            <p className="text-lg font-light text-white">
              {formatMasteryPercent(mastery.window.cleanRate)}
            </p>
          </div>
          <p
            className={
              mastery.window.cleanRate >= ADVANCEMENT_THRESHOLD
                ? 'text-[10px] text-emerald-300/80'
                : 'text-[10px] text-white/40'
            }
          >
            {mastery.window.cleanRate >= ADVANCEMENT_THRESHOLD
              ? `Above ${thresholdPercent}% — advancing when window stays full`
              : `${thresholdPercent}% needed to advance`}
          </p>
        </div>
      ) : null}

      {pendingStepBackTargetMinutes !== null ? (
        <div className="ui-surface rounded-glass p-3" role="region" aria-label="Step back offer">
          <p className="text-xs text-white/80">
            Step back to {pendingStepBackTargetMinutes} min?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void handleAcceptStepBack()}
              disabled={isRespondingToStepBack}
              className="glass-btn flex-1 rounded-glass px-2 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => void handleDeclineStepBack()}
              disabled={isRespondingToStepBack}
              className="glass-btn flex-1 rounded-glass px-2 py-1.5 text-xs text-white/80 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Keep
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
