import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './useAppStore'

describe('planner snapshot mode for today', () => {
  beforeEach(() => {
    useAppStore.setState({
      plannerViewMode: 'live',
      snapshotDateKey: null,
      dayPlanDraft: 'live draft',
      focusPlanDraft: 'focus draft',
      focusSnapshots: [],
      focusPageIndex: 0,
    })
  })

  it('returns to live planning when today is selected from the calendar', () => {
    useAppStore.getState().hydrateSnapshotPlannerDay({
      dateKey: '2026-06-18',
      dayPlan: 'yesterday',
      focusSessions: [],
      updatedAt: null,
    })

    useAppStore.getState().hydrateLivePlannerDay({
      dateKey: '2026-06-19',
      dayPlan: 'saved plan',
      focusSessions: [],
      updatedAt: null,
    })

    const state = useAppStore.getState()
    expect(state.plannerViewMode).toBe('live')
    expect(state.snapshotDateKey).toBeNull()
    expect(state.dayPlanDraft).toBe('saved plan')
  })

  it('returns to live planning only via hydrateLivePlannerDay', () => {
    useAppStore.getState().hydrateSnapshotPlannerDay({
      dateKey: '2026-06-19',
      dayPlan: 'saved plan',
      focusSessions: [],
      updatedAt: null,
    })

    useAppStore.getState().hydrateLivePlannerDay({
      dateKey: '2026-06-19',
      dayPlan: 'saved plan',
      focusSessions: [],
      updatedAt: null,
    })

    const state = useAppStore.getState()
    expect(state.plannerViewMode).toBe('live')
    expect(state.snapshotDateKey).toBeNull()
  })
})

describe('focus plan draft lifecycle', () => {
  beforeEach(() => {
    useAppStore.setState({
      plannerViewMode: 'live',
      focusPlanDraft: 'session plan',
      focusSnapshots: [],
      focusPageIndex: 0,
    })
  })

  it('clears the draft when a focus session starts so the next slot is empty', () => {
    useAppStore.getState().recordFocusSessionStart({
      sessionId: 'session-1',
      planText: 'session plan',
      startedAt: '2026-06-19T10:00:00.000Z',
    })

    const state = useAppStore.getState()
    expect(state.focusPlanDraft).toBe('')
    expect(state.focusDraftSlotVisible).toBe(false)
    expect(state.focusPageIndex).toBe(0)
    expect(state.focusSnapshots).toHaveLength(1)
  })

  it('opens the draft page without clearing text when a focus cycle completes', () => {
    useAppStore.getState().recordFocusSessionStart({
      sessionId: 'session-1',
      planText: 'session plan',
      startedAt: '2026-06-19T10:00:00.000Z',
    })
    useAppStore.getState().setFocusPlanDraft('next session plan')

    useAppStore.getState().recordFocusSessionCycleComplete()

    const state = useAppStore.getState()
    expect(state.focusPlanDraft).toBe('next session plan')
    expect(state.focusDraftSlotVisible).toBe(true)
    expect(state.focusPageIndex).toBe(1)
  })
})
