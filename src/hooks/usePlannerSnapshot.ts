import { useCallback } from 'react'
import { toDateKey } from '../lib/calendarGrid'
import { emptyPlannerDay, loadPlannerDay } from '../lib/plannerDays'
import { flushPendingLiveDayPlanSave } from './usePlannerDayPersistence'
import { useAppStore } from '../store/useAppStore'

/** Past calendar days open read-only snapshots; today returns to live planning. */
export function usePlannerSnapshot() {
  const userId = useAppStore((s) => s.userId)
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  const openSnapshot = useCallback(
    async (dateKey: string) => {
      if (!userId || userDataStatus !== 'ready') return

      await flushPendingLiveDayPlanSave()

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
    const { liveDayPlanDraft } = useAppStore.getState()

    try {
      const plannerDay = await loadPlannerDay(userId, todayKey)
      useAppStore.getState().hydrateLivePlannerDay({
        ...plannerDay,
        dateKey: todayKey,
        dayPlan: liveDayPlanDraft,
      })
    } catch (err) {
      console.warn('[planner] Failed to restore live planner day:', err)
      useAppStore.getState().hydrateLivePlannerDay({
        dateKey: todayKey,
        dayPlan: liveDayPlanDraft,
        focusSessions: [],
        updatedAt: null,
      })
    }
  }, [userId, userDataStatus])

  return { openSnapshot, returnToToday }
}
