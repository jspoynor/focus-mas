import type { FocusSession } from '../types'

export const WINDOW_MINUTES = 300
export const ADVANCEMENT_THRESHOLD = 0.8
export const STEP_BACK_THRESHOLD = 0.5
export const MIN_STAGE_MINUTES = 25
export const MAX_STAGE_MINUTES = 90
export const STAGE_INCREMENT = 5

export interface RollingWindowResult {
  sessions: FocusSession[]
  totalMinutes: number
  sessionCount: number
  cleanCount: number
  cleanRate: number
  isFull: boolean
}

/** Sessions with survey answers, newest first. */
export function surveyCompleteSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter(
    (session) =>
      session.distracted !== null &&
      session.q1Distracted !== null &&
      session.q2UsedPhone !== null,
  )
}

export function computeRollingWindow(sessions: FocusSession[]): RollingWindowResult {
  const sorted = [...surveyCompleteSessions(sessions)].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )

  const windowSessions: FocusSession[] = []
  let totalMinutes = 0

  for (const session of sorted) {
    windowSessions.push(session)
    totalMinutes += session.durationMinutes
    if (totalMinutes >= WINDOW_MINUTES) break
  }

  const sessionCount = windowSessions.length
  const cleanCount = windowSessions.filter((session) => !session.distracted).length
  const cleanRate = sessionCount > 0 ? cleanCount / sessionCount : 0

  return {
    sessions: windowSessions,
    totalMinutes,
    sessionCount,
    cleanCount,
    cleanRate,
    isFull: totalMinutes >= WINDOW_MINUTES,
  }
}

export function minSessionsForFullWindow(currentStageMinutes: number): number {
  return Math.ceil(WINDOW_MINUTES / currentStageMinutes)
}

export function canAdvance(
  window: RollingWindowResult,
  currentStageMinutes: number,
): boolean {
  if (!window.isFull) return false
  if (currentStageMinutes >= MAX_STAGE_MINUTES) return false
  if (window.cleanRate < ADVANCEMENT_THRESHOLD) return false
  return window.sessionCount >= minSessionsForFullWindow(currentStageMinutes)
}

export function nextStageMinutes(currentStageMinutes: number): number {
  return Math.min(currentStageMinutes + STAGE_INCREMENT, MAX_STAGE_MINUTES)
}

export function previousStageMinutes(currentStageMinutes: number): number {
  return Math.max(currentStageMinutes - STAGE_INCREMENT, MIN_STAGE_MINUTES)
}

export function shouldOfferStepBack(
  newMasteryPercent: number,
  prevMasteryPercent: number | null,
): boolean {
  if (prevMasteryPercent === null) return false
  return (
    newMasteryPercent < prevMasteryPercent &&
    newMasteryPercent < STEP_BACK_THRESHOLD
  )
}

export function buildingProgressPercent(totalMinutes: number): number {
  return Math.min(100, Math.round((totalMinutes / WINDOW_MINUTES) * 100))
}

export function formatMasteryPercent(cleanRate: number): string {
  return `${Math.round(cleanRate * 100)}%`
}
