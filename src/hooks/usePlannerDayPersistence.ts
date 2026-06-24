import { useEffect, useRef } from 'react'
import { toDateKey } from '../lib/calendarGrid'
import { saveDayPlan, saveFocusSnapshots } from '../lib/plannerDays'
import { useAppStore } from '../store/useAppStore'

const DAY_PLAN_SAVE_DEBOUNCE_MS = 2_000
const SAVED_INDICATOR_MS = 2_000

let dayPlanDebounceTimer: ReturnType<typeof setTimeout> | null = null
let savedIndicatorTimer: ReturnType<typeof setTimeout> | null = null
let lastPersistedDayPlan: { dateKey: string; dayPlan: string } | null = null
let inFlightDayPlanSave: Promise<void> | null = null

function clearDayPlanDebounceTimer() {
  if (dayPlanDebounceTimer) {
    clearTimeout(dayPlanDebounceTimer)
    dayPlanDebounceTimer = null
  }
}

function clearSavedIndicatorTimer() {
  if (savedIndicatorTimer) {
    clearTimeout(savedIndicatorTimer)
    savedIndicatorTimer = null
  }
}

async function persistDayPlan(targetUserId: string, dateKey: string, dayPlan: string) {
  const last = lastPersistedDayPlan
  if (last?.dateKey === dateKey && last.dayPlan === dayPlan) {
    return
  }

  const { setDayPlanSaveStatus } = useAppStore.getState()
  setDayPlanSaveStatus('pending')

  const savePromise = saveDayPlan(targetUserId, dateKey, dayPlan)
    .then(() => {
      lastPersistedDayPlan = { dateKey, dayPlan }
      setDayPlanSaveStatus('saved')
      clearSavedIndicatorTimer()
      savedIndicatorTimer = setTimeout(() => {
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
      if (inFlightDayPlanSave === savePromise) {
        inFlightDayPlanSave = null
      }
    })

  inFlightDayPlanSave = savePromise
  await savePromise
}

async function flushPendingDayPlanSave() {
  clearDayPlanDebounceTimer()

  const state = useAppStore.getState()
  if (state.authStatus !== 'signed-in' || !state.userId || state.userDataStatus !== 'ready') {
    return
  }
  if (state.plannerViewMode !== 'live') {
    return
  }

  await persistDayPlan(state.userId, state.liveDateKey, state.liveDayPlanDraft)

  if (inFlightDayPlanSave) {
    await inFlightDayPlanSave
  }
}

/** Flush any pending live day-plan write before leaving today (e.g. opening a snapshot). */
export async function flushPendingLiveDayPlanSave(): Promise<void> {
  await flushPendingDayPlanSave()
}

let focusSnapshotDebounceTimer: ReturnType<typeof setTimeout> | null = null

function clearFocusSnapshotDebounceTimer() {
  if (focusSnapshotDebounceTimer) {
    clearTimeout(focusSnapshotDebounceTimer)
    focusSnapshotDebounceTimer = null
  }
}

async function persistFocusSnapshots(): Promise<void> {
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
    await saveFocusSnapshots(state.userId, state.liveDateKey, state.focusSnapshots)
  } catch (err) {
    console.warn('[planner] Focus snapshot save failed:', err)
  }
}

/** Debounced write for checkbox edits on today's archived focus sessions. */
export function queueFocusSnapshotPersist() {
  clearFocusSnapshotDebounceTimer()
  focusSnapshotDebounceTimer = setTimeout(() => {
    focusSnapshotDebounceTimer = null
    void persistFocusSnapshots()
  }, DAY_PLAN_SAVE_DEBOUNCE_MS)
}

async function flushPendingFocusSnapshotSave() {
  clearFocusSnapshotDebounceTimer()
  await persistFocusSnapshots()
}

function msUntilNextLocalMidnight(): number {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  return nextMidnight.getTime() - now.getTime()
}

/** Debounced day-plan writes and local-midnight rollover for live today mode. */
export function usePlannerDayPersistence() {
  const liveDayPlanDraft = useAppStore((s) => s.liveDayPlanDraft)
  const liveDateKey = useAppStore((s) => s.liveDateKey)
  const plannerViewMode = useAppStore((s) => s.plannerViewMode)
  const userDataStatus = useAppStore((s) => s.userDataStatus)
  const authStatus = useAppStore((s) => s.authStatus)
  const userId = useAppStore((s) => s.userId)

  const prevUserDataStatusRef = useRef(userDataStatus)
  useEffect(() => {
    if (prevUserDataStatusRef.current !== 'ready' && userDataStatus === 'ready') {
      const state = useAppStore.getState()
      lastPersistedDayPlan = {
        dateKey: state.liveDateKey,
        dayPlan: state.liveDayPlanDraft,
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
      clearDayPlanDebounceTimer()
      return
    }

    const last = lastPersistedDayPlan
    if (last?.dateKey === liveDateKey && last.dayPlan === liveDayPlanDraft) {
      return
    }

    clearDayPlanDebounceTimer()
    dayPlanDebounceTimer = setTimeout(() => {
      dayPlanDebounceTimer = null
      const state = useAppStore.getState()
      void persistDayPlan(state.userId!, state.liveDateKey, state.liveDayPlanDraft)
    }, DAY_PLAN_SAVE_DEBOUNCE_MS)

    return clearDayPlanDebounceTimer
  }, [authStatus, userId, userDataStatus, plannerViewMode, liveDateKey, liveDayPlanDraft])

  useEffect(() => {
    if (authStatus !== 'signed-in') {
      lastPersistedDayPlan = null
      clearDayPlanDebounceTimer()
      clearSavedIndicatorTimer()
    }
  }, [authStatus])

  useEffect(() => {
    lastPersistedDayPlan = null
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
        useAppStore.setState({ liveDayPlanDraft: '' })
        return
      }

      clearDayPlanDebounceTimer()
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
          beforeFlush.liveDayPlanDraft,
        )
        if (inFlightDayPlanSave) {
          await inFlightDayPlanSave
        }
        await flushPendingFocusSnapshotSave()
      }

      const latest = useAppStore.getState()
      if (latest.plannerViewMode === 'snapshot') {
        latest.setLiveDateKey(newDateKey)
        useAppStore.setState({ liveDayPlanDraft: '' })
        return
      }

      latest.applyLiveMidnightRollover()
      lastPersistedDayPlan = { dateKey: newDateKey, dayPlan: '' }
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
      clearDayPlanDebounceTimer()
      clearSavedIndicatorTimer()
      void flushPendingDayPlanSave()
      void flushPendingFocusSnapshotSave()
    },
    [],
  )
}
