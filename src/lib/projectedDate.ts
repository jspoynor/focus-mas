import {
  ADVANCEMENT_THRESHOLD,
  computeRollingWindow,
  MAX_STAGE_MINUTES,
  surveyCompleteSessions,
} from './mastery'
import type { FocusSession } from '../types'

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function computeAvgSessionsPerDay(sessions: FocusSession[]): number {
  const complete = surveyCompleteSessions(sessions)
  if (complete.length === 0) return 0

  const dates = complete.map((session) => {
    const date = new Date(session.completedAt)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  })

  const earliest = Math.min(...dates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daySpan = Math.max(1, Math.round((today.getTime() - earliest) / 86_400_000) + 1)
  return complete.length / daySpan
}

export function computeProjectedAdvancementDate(
  sessions: FocusSession[],
  currentStageMinutes: number,
): Date | null {
  const window = computeRollingWindow(sessions)

  if (!window.isFull) return null
  if (window.cleanRate >= ADVANCEMENT_THRESHOLD) return null
  if (currentStageMinutes >= MAX_STAGE_MINUTES) return null

  const cleanNeeded = Math.ceil(ADVANCEMENT_THRESHOLD * window.sessionCount) - window.cleanCount
  if (cleanNeeded <= 0) return null

  const avgSessionsPerDay = computeAvgSessionsPerDay(sessions)
  if (avgSessionsPerDay <= 0) return null

  const daysToAdvance = Math.ceil(cleanNeeded / avgSessionsPerDay)
  const projected = new Date()
  projected.setHours(0, 0, 0, 0)
  projected.setDate(projected.getDate() + daysToAdvance)
  return projected
}

export function formatProjectedDateLabel(date: Date): string {
  const formatted = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return `If all upcoming sessions are clean, you could advance by ${formatted}.`
}

export function projectedDateKey(date: Date | null): string | null {
  return date ? toDateKey(date) : null
}
