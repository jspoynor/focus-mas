import { useEffect, useState } from 'react'
import { MIN_STAGE_MINUTES, STREAK_TARGET } from '../../lib/mastery'

/**
 * The hero's calm demo timer. A real 25-minute focus session, counting down at true 1x
 * speed and quietly resetting to 25:00 when it reaches zero. No survey, no reward beat —
 * just a live clock and a static streak. It never touches the store, auth, or Firestore.
 */

export const DEMO_STAGE_MINUTES = MIN_STAGE_MINUTES
/** The streak shown under the timer — decoration, fixed. Nothing on this page advances it. */
export const DEMO_STREAK = 3

const TOTAL_SECONDS = DEMO_STAGE_MINUTES * 60
const TICK_MS = 250

export interface DemoLoopState {
  remainingSeconds: number
  streak: number
}

/** Reduced-motion visitors get the timer's natural resting state: a still 25:00. */
export const STATIC_STATE: DemoLoopState = {
  remainingSeconds: TOTAL_SECONDS,
  streak: DEMO_STREAK,
}

/**
 * One countdown tick against a wall-clock anchor. At or past zero it reports a fresh full
 * session and a new anchor — the quiet reset — so the visible time never goes negative.
 * Pure, so it carries the unit tests; the hook just drives it on an interval.
 */
export function tickCountdown(
  endTime: number,
  now: number,
): { remainingSeconds: number; endTime: number } {
  const remaining = Math.round((endTime - now) / 1000)
  if (remaining <= 0) {
    return { remainingSeconds: TOTAL_SECONDS, endTime: now + TOTAL_SECONDS * 1000 }
  }
  return { remainingSeconds: remaining, endTime }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useDemoLoop(): DemoLoopState {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    let intervalId: number | null = null
    // Wall-clock anchor so the visible seconds don't drift across ticks.
    let endTime = Date.now() + TOTAL_SECONDS * 1000
    // Seconds left at the moment the tab was last backgrounded, so we resume in place.
    let pausedRemaining = TOTAL_SECONDS

    const tick = () => {
      const next = tickCountdown(endTime, Date.now())
      endTime = next.endTime
      setRemainingSeconds(next.remainingSeconds)
    }

    const start = () => {
      if (intervalId !== null) return
      // Re-anchor to the seconds left when we paused, so the timer resumes in place
      // rather than jumping ahead by however long the tab was backgrounded.
      endTime = Date.now() + pausedRemaining * 1000
      tick()
      intervalId = window.setInterval(tick, TICK_MS)
    }

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
        pausedRemaining = Math.max(0, Math.round((endTime - Date.now()) / 1000)) || TOTAL_SECONDS
      }
    }

    // A backgrounded tab should not burn a timer; the loop resumes where it paused.
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }

    handleVisibility()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [reducedMotion])

  if (reducedMotion) return STATIC_STATE
  return { remainingSeconds, streak: DEMO_STREAK }
}

export { STREAK_TARGET, TOTAL_SECONDS }
