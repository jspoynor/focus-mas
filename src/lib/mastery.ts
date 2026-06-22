import type { FocusSession } from '../types'

export const STREAK_TARGET = 5
export const MIN_STAGE_MINUTES = 25
export const MAX_STAGE_MINUTES = 90
export const STAGE_INCREMENT = 5

/** Sessions with survey answers, newest first. */
export function surveyCompleteSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter(
    (session) =>
      session.distracted !== null &&
      session.q1Distracted !== null &&
      session.q2UsedPhone !== null,
  )
}

function sessionsSinceProgression(
  sessions: FocusSession[],
  lastProgressionAt: string | null,
): FocusSession[] {
  const complete = surveyCompleteSessions(sessions)
  if (!lastProgressionAt) return complete

  const cutoff = new Date(lastProgressionAt).getTime()
  return complete.filter((session) => new Date(session.completedAt).getTime() > cutoff)
}

/** Consecutive clean sessions since last progression, counting backward from newest (0–5). */
export function computeCurrentStreak(
  sessions: FocusSession[],
  lastProgressionAt: string | null,
): number {
  const relevant = sessionsSinceProgression(sessions, lastProgressionAt)
  const sorted = [...relevant].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )

  let streak = 0
  for (const session of sorted) {
    if (session.distracted) break
    streak++
    if (streak >= STREAK_TARGET) break
  }

  return streak
}

export function canAdvance(streak: number, currentStageMinutes: number): boolean {
  return streak >= STREAK_TARGET && currentStageMinutes < MAX_STAGE_MINUTES
}

export function nextStageMinutes(currentStageMinutes: number): number {
  return Math.min(currentStageMinutes + STAGE_INCREMENT, MAX_STAGE_MINUTES)
}

export function isAtMaxStage(currentStageMinutes: number): boolean {
  return currentStageMinutes >= MAX_STAGE_MINUTES
}
