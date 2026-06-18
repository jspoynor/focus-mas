import { auth } from './firebase'
import { withTimeout } from './async'
import { toDateKey } from './calendarGrid'
import { loadPlannerDay } from './plannerDays'
import { DEFAULT_PROGRESS, ensureUserProgress } from './progress'
import { loadCompletedSessions } from './sessions'
import type { FocusSession, PlannerDay, UserProgress } from '../types'

const LOAD_TIMEOUT_MS = 10_000

export interface LoadedUserData {
  progress: UserProgress
  sessions: FocusSession[]
  plannerDay: PlannerDay
}

async function loadProgress(userId: string): Promise<UserProgress> {
  try {
    return await withTimeout(ensureUserProgress(userId), LOAD_TIMEOUT_MS, 'Progress load')
  } catch (err) {
    console.warn('[user-data] Progress load failed:', err)
    return { ...DEFAULT_PROGRESS }
  }
}

async function loadSessions(userId: string): Promise<FocusSession[]> {
  try {
    return await withTimeout(loadCompletedSessions(userId), LOAD_TIMEOUT_MS, 'Sessions load')
  } catch (err) {
    console.warn('[user-data] Sessions load failed:', err)
    return []
  }
}

async function loadTodayPlannerDay(userId: string): Promise<PlannerDay> {
  const dateKey = toDateKey(new Date())
  try {
    return await withTimeout(loadPlannerDay(userId, dateKey), LOAD_TIMEOUT_MS, 'Planner day load')
  } catch (err) {
    console.warn('[user-data] Planner day load failed:', err)
    return {
      dateKey,
      dayPlan: '',
      focusSessions: [],
      updatedAt: null,
    }
  }
}

/** Loads Firestore progress + sessions once auth is ready for the signed-in user. */
export async function loadUserData(userId: string): Promise<LoadedUserData> {
  await auth.authStateReady()

  if (auth.currentUser?.uid !== userId) {
    throw new Error('[user-data] Signed-in user does not match requested user id')
  }

  const [progress, sessions, plannerDay] = await Promise.all([
    loadProgress(userId),
    loadSessions(userId),
    loadTodayPlannerDay(userId),
  ])

  return { progress, sessions, plannerDay }
}

export function defaultUserDataFallback(): LoadedUserData {
  return {
    progress: { ...DEFAULT_PROGRESS },
    sessions: [],
    plannerDay: {
      dateKey: toDateKey(new Date()),
      dayPlan: '',
      focusSessions: [],
      updatedAt: null,
    },
  }
}
