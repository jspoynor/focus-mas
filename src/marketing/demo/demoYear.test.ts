import { describe, expect, it } from 'vitest'
import {
  MAX_STAGE_MINUTES,
  MIN_STAGE_MINUTES,
  STAGE_INCREMENT,
  STREAK_TARGET,
  computeCurrentStreak,
} from '../../lib/mastery'
import { buildDemoYear } from './demoYear'

const FIXED_TODAY = new Date('2026-07-09T12:00:00')

describe('buildDemoYear', () => {
  it('is deterministic', () => {
    const a = buildDemoYear(FIXED_TODAY)
    const b = buildDemoYear(FIXED_TODAY)
    expect(a.sessions).toEqual(b.sessions)
    expect(a.progress).toEqual(b.progress)
  })

  it('only ever advances a stage after five consecutive clean sessions', () => {
    const { sessions } = buildDemoYear(FIXED_TODAY)

    let stage = MIN_STAGE_MINUTES
    let clean = 0

    for (const session of sessions) {
      expect(session.stage).toBe(stage)
      expect(session.durationMinutes).toBe(stage)

      if (session.distracted) {
        clean = 0
        continue
      }

      clean++
      if (clean >= STREAK_TARGET && stage < MAX_STAGE_MINUTES) {
        stage += STAGE_INCREMENT
        clean = 0
      }
    }
  })

  it('produces stages on the real ladder, never above the cap', () => {
    const { sessions, progress } = buildDemoYear(FIXED_TODAY)

    for (const session of sessions) {
      expect(session.stage).toBeGreaterThanOrEqual(MIN_STAGE_MINUTES)
      expect(session.stage).toBeLessThanOrEqual(MAX_STAGE_MINUTES)
      expect(session.stage % STAGE_INCREMENT).toBe(0)
    }

    expect(progress.currentStageMinutes).toBeLessThanOrEqual(MAX_STAGE_MINUTES)
  })

  it('agrees with the app when it recomputes the streak from the sessions', () => {
    const { sessions, progress, finalStreak } = buildDemoYear(FIXED_TODAY)
    expect(computeCurrentStreak(sessions, progress.lastProgressionAt)).toBe(finalStreak)
  })

  it('marks distracted exactly when a survey answer is yes', () => {
    const { sessions } = buildDemoYear(FIXED_TODAY)

    for (const session of sessions) {
      expect(session.distracted).toBe(session.q1Distracted === true || session.q2UsedPhone === true)
    }
  })

  it('tells a story: starts at cream, climbs high, but ends mid-climb', () => {
    const { sessions, progress, finalStreak } = buildDemoYear(FIXED_TODAY)

    expect(sessions[0].stage).toBe(MIN_STAGE_MINUTES)
    expect(progress.currentStageMinutes).toBeGreaterThan(MIN_STAGE_MINUTES + 4 * STAGE_INCREMENT)
    expect(progress.lastProgressionAt).not.toBeNull()

    // Deliberate: a maxed-out ladder ends the story before the calendar does, and paints
    // the final months a flat espresso. The year must finish still climbing.
    expect(progress.currentStageMinutes).toBeLessThan(MAX_STAGE_MINUTES)
    expect(finalStreak).toBeLessThan(STREAK_TARGET)
  })

  it('has a visible slump — a stretch where the streak breaks and days go empty', () => {
    const { sessions } = buildDemoYear(FIXED_TODAY)

    const midYear = sessions.filter((session) => {
      const month = session.completedAt.slice(0, 7)
      return month >= '2026-01' && month <= '2026-03'
    })

    expect(midYear.length).toBeGreaterThan(0)
    const distractedRate = midYear.filter((s) => s.distracted).length / midYear.length
    expect(distractedRate).toBeGreaterThan(0.4)
  })

  it('every session carries complete survey answers so the calendar can shade it', () => {
    const { sessions } = buildDemoYear(FIXED_TODAY)
    expect(sessions.length).toBeGreaterThan(100)

    for (const session of sessions) {
      expect(session.q1Distracted).not.toBeNull()
      expect(session.q2UsedPhone).not.toBeNull()
      expect(session.distracted).not.toBeNull()
      expect(new Date(session.completedAt).getTime()).toBeGreaterThan(
        new Date(session.startedAt).getTime(),
      )
    }
  })
})
