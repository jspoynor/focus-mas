import { describe, expect, it } from 'vitest'
import type { FocusSession } from '../types'
import {
  formatDaySummaryLine,
  formatSessionCount,
  formatSessionTooltipDetail,
  formatSessionTooltipTitle,
  getDayStats,
  isPlannerSnapshotEligible,
  toDateKey,
} from './calendarGrid'

const baseSession: FocusSession = {
  id: 'a',
  startedAt: '2026-06-19T11:15:00.000Z',
  completedAt: '2026-06-19T12:00:00.000Z',
  durationMinutes: 45,
  stage: 45,
  distracted: false,
  q1Distracted: false,
  q2UsedPhone: false,
}

describe('isPlannerSnapshotEligible', () => {
  const today = new Date(2026, 5, 19)

  it('includes today so the today cell returns to live planning', () => {
    expect(isPlannerSnapshotEligible(today, today)).toBe(true)
  })

  it('includes past days', () => {
    const yesterday = new Date(2026, 5, 18)
    expect(isPlannerSnapshotEligible(yesterday, today)).toBe(true)
  })

  it('excludes future days', () => {
    const tomorrow = new Date(2026, 5, 20)
    expect(isPlannerSnapshotEligible(tomorrow, today)).toBe(false)
    expect(toDateKey(tomorrow) > toDateKey(today)).toBe(true)
  })
})

describe('formatSessionCount', () => {
  it('uses singular for one session', () => {
    expect(formatSessionCount(1)).toBe('1 session')
  })

  it('uses plural for multiple sessions', () => {
    expect(formatSessionCount(3)).toBe('3 sessions')
  })
})

describe('formatDaySummaryLine', () => {
  it('shows session count and uninterrupted rate', () => {
    const date = new Date(2026, 5, 19)
    const stats = getDayStats(date, [
      baseSession,
      { ...baseSession, id: 'b', distracted: true, q1Distracted: true, q2UsedPhone: false },
    ])

    expect(formatDaySummaryLine(stats)).toBe('2 sessions · 50% uninterrupted')
  })
})

describe('session tooltip formatters', () => {
  it('titles sessions by planner-aligned number', () => {
    expect(formatSessionTooltipTitle(1)).toBe('Session 1')
  })

  it('shows duration and interrupted from survey OR', () => {
    expect(formatSessionTooltipDetail(baseSession)).toBe('45 min · interrupted: no')
    expect(
      formatSessionTooltipDetail({
        ...baseSession,
        distracted: true,
        q1Distracted: false,
        q2UsedPhone: true,
      }),
    ).toBe('45 min · interrupted: yes')
  })
})
