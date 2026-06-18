import { useCallback } from 'react'
import { toDateKey } from '../lib/calendarGrid'
import { loadPlannerDay, saveDayPlan } from '../lib/plannerDays'
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

/** Opens archived planner data for a calendar day or returns to live today editing. */
export function usePlannerSnapshot() {
  const userId = useAppStore((s) => s.userId)
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  const openSnapshot = useCallback(
    async (dateKey: string) => {
      if (!userId || userDataStatus !== 'ready') return

      await flushLiveDayPlanIfNeeded()

      try {
        const plannerDay = await loadPlannerDay(userId, dateKey)
        useAppStore.getState().hydrateSnapshotPlannerDay(plannerDay)
      } catch (err) {
        console.warn('[planner] Failed to load snapshot day:', err)
      }
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
