import { describe, expect, it } from 'vitest'
import { applySurveyToSessions, mergeReloadedSessions } from './sessions'
import type { FocusSession } from '../types'

const baseSession: FocusSession = {
  id: 'older',
  startedAt: '2026-06-18T10:00:00.000Z',
  completedAt: '2026-06-18T10:25:00.000Z',
  durationMinutes: 25,
  stage: 25,
  q1Distracted: false,
  q2UsedPhone: false,
  distracted: false,
}

describe('applySurveyToSessions', () => {
  it('inserts a newly surveyed session at the front of the list', () => {
    const next = applySurveyToSessions([baseSession], {
      sessionId: 'new',
      durationMinutes: 30,
      startedAt: '2026-06-19T12:00:00.000Z',
      q1Distracted: false,
      q2UsedPhone: false,
      completedAt: '2026-06-19T12:30:00.000Z',
    })

    expect(next).toHaveLength(2)
    expect(next[0]?.id).toBe('new')
    expect(next[0]?.distracted).toBe(false)
  })

  it('updates an existing session with survey answers', () => {
    const pendingSession: FocusSession = {
      ...baseSession,
      id: 'pending',
      q1Distracted: null,
      q2UsedPhone: null,
      distracted: null,
    }

    const next = applySurveyToSessions([pendingSession], {
      sessionId: 'pending',
      durationMinutes: 25,
      startedAt: pendingSession.startedAt,
      q1Distracted: true,
      q2UsedPhone: false,
      completedAt: pendingSession.completedAt,
    })

    expect(next).toHaveLength(1)
    expect(next[0]?.distracted).toBe(true)
  })
})

describe('mergeReloadedSessions', () => {
  it('keeps locally synced survey answers when Firestore reload is still pending', () => {
    const localSession: FocusSession = {
      id: 'fresh',
      startedAt: '2026-06-19T12:00:00.000Z',
      completedAt: '2026-06-19T12:30:00.000Z',
      durationMinutes: 30,
      stage: 30,
      q1Distracted: false,
      q2UsedPhone: false,
      distracted: false,
    }

    const merged = mergeReloadedSessions([], [localSession])

    expect(merged).toEqual([localSession])
  })

  it('prefers the locally complete survey over an incomplete reloaded copy', () => {
    const localSession: FocusSession = {
      id: 'fresh',
      startedAt: '2026-06-19T12:00:00.000Z',
      completedAt: '2026-06-19T12:30:00.000Z',
      durationMinutes: 30,
      stage: 30,
      q1Distracted: true,
      q2UsedPhone: false,
      distracted: true,
    }
    const reloadedSession: FocusSession = {
      ...localSession,
      q1Distracted: null,
      q2UsedPhone: null,
      distracted: null,
    }

    const merged = mergeReloadedSessions([reloadedSession], [localSession])

    expect(merged).toEqual([localSession])
  })
})
