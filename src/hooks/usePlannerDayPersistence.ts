import { useEffect, useRef } from 'react'
import { toDateKey } from '../lib/calendarGrid'
import { saveDayPlan } from '../lib/plannerDays'
import { useAppStore } from '../store/useAppStore'

const DAY_PLAN_SAVE_DEBOUNCE_MS = 2_000
const SAVED_INDICATOR_MS = 2_000

function msUntilNextLocalMidnight(): number {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  return nextMidnight.getTime() - now.getTime()
}

/** Debounced day-plan writes and local-midnight rollover for live today mode. */
export function usePlannerDayPersistence() {
  const dayPlanDraft = useAppStore((s) => s.dayPlanDraft)
  const liveDateKey = useAppStore((s) => s.liveDateKey)
  const plannerViewMode = useAppStore((s) => s.plannerViewMode)
  const userDataStatus = useAppStore((s) => s.userDataStatus)
  const authStatus = useAppStore((s) => s.authStatus)
  const userId = useAppStore((s) => s.userId)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPersistedRef = useRef<{ dateKey: string; dayPlan: string } | null>(null)
  const inFlightSaveRef = useRef<Promise<void> | null>(null)

  const clearDebounceTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }

  const clearSavedIndicatorTimer = () => {
    if (savedIndicatorTimerRef.current) {
      clearTimeout(savedIndicatorTimerRef.current)
      savedIndicatorTimerRef.current = null
    }
  }

  const persistDayPlan = async (targetUserId: string, dateKey: string, dayPlan: string) => {
    const last = lastPersistedRef.current
    if (last?.dateKey === dateKey && last.dayPlan === dayPlan) {
      return
    }

    const { setDayPlanSaveStatus } = useAppStore.getState()
    setDayPlanSaveStatus('pending')

    const savePromise = saveDayPlan(targetUserId, dateKey, dayPlan)
      .then(() => {
        lastPersistedRef.current = { dateKey, dayPlan }
        setDayPlanSaveStatus('saved')
        clearSavedIndicatorTimer()
        savedIndicatorTimerRef.current = setTimeout(() => {
          const { dayPlanSaveStatus } = useAppStore.getState()
          if (dayPlanSaveStatus === 'saved') {
            setDayPlanSaveStatus('idle')
          }
        }, SAVED_INDICATOR_MS)
      })
      .catch((err) => {
        console.warn('[planner] Day plan save failed:', err)
        setDayPlanSaveStatus('error')
      })
      .finally(() => {
        if (inFlightSaveRef.current === savePromise) {
          inFlightSaveRef.current = null
        }
      })

    inFlightSaveRef.current = savePromise
    await savePromise
  }

  const flushPendingDayPlanSave = async () => {
    clearDebounceTimer()

    const state = useAppStore.getState()
    if (state.authStatus !== 'signed-in' || !state.userId || state.userDataStatus !== 'ready') {
      return
    }
    if (state.plannerViewMode !== 'live') {
      return
    }

    await persistDayPlan(state.userId, state.liveDateKey, state.dayPlanDraft)

    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current
    }
  }

  const prevUserDataStatusRef = useRef(userDataStatus)
  useEffect(() => {
    if (prevUserDataStatusRef.current !== 'ready' && userDataStatus === 'ready') {
      const state = useAppStore.getState()
      lastPersistedRef.current = {
        dateKey: state.liveDateKey,
        dayPlan: state.dayPlanDraft,
      }
    }
    prevUserDataStatusRef.current = userDataStatus
  }, [userDataStatus])

  useEffect(() => {
    if (
      authStatus !== 'signed-in' ||
      !userId ||
      userDataStatus !== 'ready' ||
      plannerViewMode !== 'live'
    ) {
      clearDebounceTimer()
      return
    }

    const last = lastPersistedRef.current
    if (last?.dateKey === liveDateKey && last.dayPlan === dayPlanDraft) {
      return
    }

    clearDebounceTimer()
    debounceTimerRef.current = setTimeout(() => {
      void persistDayPlan(userId, liveDateKey, dayPlanDraft)
    }, DAY_PLAN_SAVE_DEBOUNCE_MS)

    return clearDebounceTimer
  }, [authStatus, userId, userDataStatus, plannerViewMode, liveDateKey, dayPlanDraft])

  useEffect(() => {
    if (authStatus !== 'signed-in') {
      lastPersistedRef.current = null
      clearDebounceTimer()
      clearSavedIndicatorTimer()
    }
  }, [authStatus])

  useEffect(() => {
    lastPersistedRef.current = null
  }, [userId])

  useEffect(() => {
    if (authStatus !== 'signed-in') {
      return
    }

    let cancelled = false
    let midnightTimer: ReturnType<typeof setTimeout> | null = null

    const handleMidnightRollover = async () => {
      const state = useAppStore.getState()
      const newDateKey = toDateKey(new Date())

      if (state.plannerViewMode === 'snapshot') {
        state.setLiveDateKey(newDateKey)
        return
      }

      clearDebounceTimer()
      const beforeFlush = useAppStore.getState()
      if (
        beforeFlush.authStatus === 'signed-in' &&
        beforeFlush.userId &&
        beforeFlush.userDataStatus === 'ready' &&
        beforeFlush.plannerViewMode === 'live'
      ) {
        await persistDayPlan(
          beforeFlush.userId,
          beforeFlush.liveDateKey,
          beforeFlush.dayPlanDraft,
        )
        if (inFlightSaveRef.current) {
          await inFlightSaveRef.current
        }
      }

      const latest = useAppStore.getState()
      if (latest.plannerViewMode === 'snapshot') {
        latest.setLiveDateKey(newDateKey)
        return
      }

      latest.applyLiveMidnightRollover()
      lastPersistedRef.current = { dateKey: newDateKey, dayPlan: '' }
    }

    const scheduleMidnightRollover = () => {
      if (cancelled) return
      midnightTimer = setTimeout(() => {
        void handleMidnightRollover().finally(() => {
          scheduleMidnightRollover()
        })
      }, msUntilNextLocalMidnight())
    }

    scheduleMidnightRollover()

    return () => {
      cancelled = true
      if (midnightTimer) {
        clearTimeout(midnightTimer)
      }
    }
  }, [authStatus])

  useEffect(
    () => () => {
      clearDebounceTimer()
      clearSavedIndicatorTimer()
      void flushPendingDayPlanSave()
    },
    [],
  )
}
