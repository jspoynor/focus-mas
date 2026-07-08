import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reconcileActiveSession } from './sessionRecovery'
import { fetchSessionReconcileState } from './sessions'
import { saveFocusSnapshots } from './plannerDays'
import type { FocusPlanSnapshot, FocusSession, PlannerDay } from '../types'

vi.mock('./sessions', () => ({
  fetchSessionReconcileState: vi.fn(),
}))
vi.mock('./plannerDays', () => ({
  saveFocusSnapshots: vi.fn().mockResolvedValue(undefined),
}))

const fetchState = vi.mocked(fetchSessionReconcileState)
const saveSnapshots = vi.mocked(saveFocusSnapshots)

function snapshot(sessionId: string, startedAt = '2026-07-08T10:00:00.000Z'): FocusPlanSnapshot {
  return { sessionId, planText: `plan ${sessionId}`, startedAt }
}

function plannerDay(focusSessions: FocusPlanSnapshot[]): PlannerDay {
  return { dateKey: '2026-07-08', dayPlan: '', focusSessions, updatedAt: null }
}

function completedSession(id: string): FocusSession {
  return {
    id,
    startedAt: '2026-07-08T09:00:00.000Z',
    completedAt: '2026-07-08T09:25:00.000Z',
    durationMinutes: 25,
    stage: 25,
    q1Distracted: false,
    q2UsedPhone: false,
    distracted: false,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reconcileActiveSession', () => {
  it('leaves fully-surveyed snapshots untouched without any reads', async () => {
    const day = plannerDay([snapshot('a')])
    const result = await reconcileActiveSession('u', day, [completedSession('a')])

    expect(fetchState).not.toHaveBeenCalled()
    expect(saveSnapshots).not.toHaveBeenCalled()
    expect(result.plannerDay).toBe(day)
    expect(result.restoredSurvey).toBeNull()
  })

  it('cancels a mid-focus orphan (no session doc) and persists the removal', async () => {
    fetchState.mockResolvedValue({ kind: 'missing' })
    const day = plannerDay([snapshot('orphan')])

    const result = await reconcileActiveSession('u', day, [])

    expect(saveSnapshots).toHaveBeenCalledWith('u', '2026-07-08', [])
    expect(result.plannerDay.focusSessions).toEqual([])
    expect(result.restoredSurvey).toBeNull()
  })

  it('restores the survey for a survey-incomplete session and keeps the snapshot', async () => {
    fetchState.mockResolvedValue({ kind: 'incomplete', durationMinutes: 30 })
    const day = plannerDay([snapshot('pending', '2026-07-08T11:00:00.000Z')])

    const result = await reconcileActiveSession('u', day, [])

    expect(saveSnapshots).not.toHaveBeenCalled()
    expect(result.plannerDay.focusSessions).toHaveLength(1)
    expect(result.restoredSurvey).toEqual({
      sessionId: 'pending',
      durationMinutes: 30,
      startedAt: '2026-07-08T11:00:00.000Z',
    })
  })

  it('never cancels on an uncertain read', async () => {
    fetchState.mockResolvedValue({ kind: 'unknown' })
    const day = plannerDay([snapshot('a')])

    const result = await reconcileActiveSession('u', day, [])

    expect(saveSnapshots).not.toHaveBeenCalled()
    expect(result.plannerDay.focusSessions).toHaveLength(1)
    expect(result.restoredSurvey).toBeNull()
  })

  it('cancels a missing orphan while restoring a separate incomplete survey', async () => {
    fetchState.mockImplementation(async (_userId: string, sessionId: string) =>
      sessionId === 'gone'
        ? { kind: 'missing' as const }
        : { kind: 'incomplete' as const, durationMinutes: 25 },
    )
    const day = plannerDay([
      snapshot('gone', '2026-07-08T08:00:00.000Z'),
      snapshot('pending', '2026-07-08T09:00:00.000Z'),
    ])

    const result = await reconcileActiveSession('u', day, [])

    expect(saveSnapshots).toHaveBeenCalledWith('u', '2026-07-08', [
      snapshot('pending', '2026-07-08T09:00:00.000Z'),
    ])
    expect(result.plannerDay.focusSessions).toEqual([
      snapshot('pending', '2026-07-08T09:00:00.000Z'),
    ])
    expect(result.restoredSurvey?.sessionId).toBe('pending')
  })
})
