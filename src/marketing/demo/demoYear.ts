import {
  MIN_STAGE_MINUTES,
  STREAK_TARGET,
  nextStageMinutes,
} from '../../lib/mastery'
import type { FocusSession, UserProgress } from '../../types'

/**
 * A narrated year of focus history for the marketing calendar.
 *
 * Stages are never hand-placed. Sessions are emitted day by day and the stage is
 * advanced by the same rule the app uses — five consecutive clean sessions — so the
 * belt colors on the page cannot contradict `mastery.ts`. The story the year tells
 * (sparse and cream, a broken streak in the middle, dense and dark by the end) comes
 * from the density and distraction schedules below, not from forcing a color.
 */

export interface DemoYear {
  sessions: FocusSession[]
  progress: UserProgress
  /** Clean sessions since the last progression, at the end of the year. */
  finalStreak: number
}

const DAYS = 330
const SESSION_START_HOUR = 9
const HOURS_BETWEEN_SESSIONS = 2

/** Deterministic PRNG — the page must render identically on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The mid-year slump: the reader should see a visible gap and a broken streak. */
function isSlump(progress: number): boolean {
  return progress >= 0.42 && progress < 0.5
}

/** Fraction of days with any sessions at all — commitment builds over the year. */
function activeDayChance(progress: number): number {
  if (isSlump(progress)) return 0.12
  return 0.32 + 0.42 * progress
}

/**
 * Distraction decays as attention is trained; it spikes during the slump. Tuned so the
 * year ends mid-climb rather than pinned at the 90-minute cap — a maxed-out ladder and a
 * flat wall of espresso would end the story months before the calendar does.
 */
function distractionChance(progress: number): number {
  if (isSlump(progress)) return 0.8
  return 0.52 - 0.29 * progress
}

function sessionsForDay(progress: number, random: () => number): number {
  if (random() > activeDayChance(progress)) return 0
  if (progress > 0.8 && random() < 0.22) return 3
  if (progress > 0.4 && random() < 0.38) return 2
  return 1
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function buildDemoYear(today: Date = new Date()): DemoYear {
  const random = mulberry32(0x0c0ffee)
  const sessions: FocusSession[] = []

  let stageMinutes = MIN_STAGE_MINUTES
  let streak = 0
  let lastProgressionAt: string | null = null

  const firstDay = startOfDay(today)
  firstDay.setDate(firstDay.getDate() - (DAYS - 1))

  for (let dayIndex = 0; dayIndex < DAYS; dayIndex++) {
    const progress = dayIndex / (DAYS - 1)
    const day = new Date(firstDay)
    day.setDate(firstDay.getDate() + dayIndex)

    const count = sessionsForDay(progress, random)

    for (let i = 0; i < count; i++) {
      const completedAt = new Date(day)
      completedAt.setHours(SESSION_START_HOUR + i * HOURS_BETWEEN_SESSIONS, 0, 0, 0)

      const startedAt = new Date(completedAt.getTime() - stageMinutes * 60_000)

      // A distracted session trips q1, q2, or both — the app treats any yes the same way.
      const distracted = random() < distractionChance(progress)
      const q1Distracted = distracted && random() < 0.75
      const q2UsedPhone = distracted && (!q1Distracted || random() < 0.5)

      sessions.push({
        id: `demo-${dayIndex}-${i}`,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMinutes: stageMinutes,
        stage: stageMinutes,
        q1Distracted,
        q2UsedPhone,
        distracted,
      })

      // The app's rule, applied verbatim: five clean in a row earns +5 minutes.
      if (distracted) {
        streak = 0
        continue
      }

      streak++
      if (streak < STREAK_TARGET) continue

      const advanced = nextStageMinutes(stageMinutes)
      if (advanced === stageMinutes) {
        // At the 90-minute cap there is nothing to earn; the bar stays full.
        streak = STREAK_TARGET
        continue
      }

      stageMinutes = advanced
      lastProgressionAt = completedAt.toISOString()
      streak = 0
    }
  }

  return {
    sessions,
    progress: { currentStageMinutes: stageMinutes, lastProgressionAt },
    finalStreak: streak,
  }
}
