import { describe, expect, it } from 'vitest'
import {
  canAdvance,
  computeCurrentStreak,
  isAtMaxStage,
  STREAK_TARGET,
} from './mastery'
import type { FocusSession } from '../types'

function session(
  overrides: Partial<FocusSession> & Pick<FocusSession, 'id' | 'completedAt' | 'distracted'>,
): FocusSession {
  return {
    startedAt: overrides.completedAt,
    durationMinutes: 25,
    stage: 25,
    q1Distracted: overrides.distracted ?? false,
    q2UsedPhone: false,
    ...overrides,
  }
}

describe('computeCurrentStreak', () => {
  it('returns 0 when the most recent session was distracted', () => {
    const sessions = [
      session({ id: '2', completedAt: '2026-06-02T12:00:00.000Z', distracted: true }),
      session({ id: '1', completedAt: '2026-06-01T12:00:00.000Z', distracted: false }),
    ]

    expect(computeCurrentStreak(sessions, null)).toBe(0)
  })

  it('counts consecutive clean sessions from newest backward', () => {
    const sessions = [
      session({ id: '3', completedAt: '2026-06-03T12:00:00.000Z', distracted: false }),
      session({ id: '2', completedAt: '2026-06-02T12:00:00.000Z', distracted: false }),
      session({ id: '1', completedAt: '2026-06-01T12:00:00.000Z', distracted: true }),
    ]

    expect(computeCurrentStreak(sessions, null)).toBe(2)
  })

  it('caps at the streak target', () => {
    const sessions = Array.from({ length: 7 }, (_, index) =>
      session({
        id: String(index),
        completedAt: new Date(Date.UTC(2026, 5, index + 1)).toISOString(),
        distracted: false,
      }),
    )

    expect(computeCurrentStreak(sessions, null)).toBe(STREAK_TARGET)
  })

  it('only counts sessions after lastProgressionAt', () => {
    const sessions = [
      session({ id: '3', completedAt: '2026-06-03T12:00:00.000Z', distracted: false }),
      session({ id: '2', completedAt: '2026-06-02T12:00:00.000Z', distracted: false }),
      session({ id: '1', completedAt: '2026-06-01T12:00:00.000Z', distracted: false }),
    ]

    expect(computeCurrentStreak(sessions, '2026-06-02T11:00:00.000Z')).toBe(2)
  })

  it('ignores incomplete sessions', () => {
    const sessions: FocusSession[] = [
      {
        id: '2',
        startedAt: '2026-06-02T11:00:00.000Z',
        completedAt: '2026-06-02T12:00:00.000Z',
        durationMinutes: 25,
        stage: 25,
        q1Distracted: null,
        q2UsedPhone: null,
        distracted: null,
      },
      session({ id: '1', completedAt: '2026-06-01T12:00:00.000Z', distracted: false }),
    ]

    expect(computeCurrentStreak(sessions, null)).toBe(1)
  })
})

describe('canAdvance', () => {
  it('requires a full streak below max stage', () => {
    expect(canAdvance(STREAK_TARGET, 25)).toBe(true)
    expect(canAdvance(STREAK_TARGET - 1, 25)).toBe(false)
    expect(canAdvance(STREAK_TARGET, 90)).toBe(false)
  })
})

describe('isAtMaxStage', () => {
  it('detects the stage cap', () => {
    expect(isAtMaxStage(90)).toBe(true)
    expect(isAtMaxStage(85)).toBe(false)
  })
})
