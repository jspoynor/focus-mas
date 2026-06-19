import { useCallback } from 'react'
import { toDateKey } from '../lib/calendarGrid'
import { emptyPlannerDay, loadPlannerDay, saveDayPlan } from '../lib/plannerDays'
import { useAppStore } from '../store/useAppStore'

async function flushLiveDayPlanIfNeeded(): Promise<void> {
  const state = useAppStore.getState()
  if (
    state.authStatus !== 'signed-in' ||
    !state.userId ||
    state.userDataStatus !== 'ready' ||
    state.plannerViewMode !== 'live'
  ) {
    return
  }

  try {
    await saveDayPlan(state.userId, state.liveDateKey, state.dayPlanDraft)
  } catch (err) {
    console.warn('[planner] Failed to flush day plan before snapshot:', err)
  }
}

/** Past calendar days open read-only snapshots; today returns to live planning. */
export function usePlannerSnapshot() {
  const userId = useAppStore((s) => s.userId)
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  const openSnapshot = useCallback(
    async (dateKey: string) => {
      if (!userId || userDataStatus !== 'ready') return

      await flushLiveDayPlanIfNeeded()

      let plannerDay
      try {
        plannerDay = await loadPlannerDay(userId, dateKey)
      } catch (err) {
        console.warn('[planner] Failed to load snapshot day:', err)
        plannerDay = emptyPlannerDay(dateKey)
      }

      useAppStore.getState().hydrateSnapshotPlannerDay(plannerDay)
    },
    [userId, userDataStatus],
  )

  const returnToToday = useCallback(async () => {
    if (!userId || userDataStatus !== 'ready') return

    const todayKey = toDateKey(new Date())

    try {
      const plannerDay = await loadPlannerDay(userId, todayKey)
      useAppStore.getState().hydrateLivePlannerDay(plannerDay)
    } catch (err) {
      console.warn('[planner] Failed to restore live planner day:', err)
      useAppStore.getState().hydrateLivePlannerDay({
        dateKey: todayKey,
        dayPlan: '',
        focusSessions: [],
        updatedAt: null,
      })
    }
  }, [userId, userDataStatus])

  return { openSnapshot, returnToToday }
}
