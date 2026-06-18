import { create } from 'zustand'
import {
  canFocusGoNext,
  canFocusGoPrev,
  type PlannerViewMode,
} from '../lib/plannerPages'
import type { FocusPlanSnapshot, FocusSession, UserProgress } from '../types'

export type AuthStatus = 'unknown' | 'signed-out' | 'signed-in'
export type UserDataStatus = 'idle' | 'loading' | 'ready'

export interface AppState {
  authStatus: AuthStatus
  userId: string | null
  displayName: string | null
  userDataStatus: UserDataStatus
  progress: UserProgress | null
  sessions: FocusSession[]
  /** Active focus session id while timer is running; null when idle. */
  activeSessionId: string | null
  /** Target stage minutes when a step-back offer is active; null otherwise. */
  pendingStepBackTargetMinutes: number | null
  dayPlanDraft: string
  focusPlanDraft: string
  focusPageIndex: number
  focusSnapshots: FocusPlanSnapshot[]
  plannerViewMode: PlannerViewMode
}

export interface AppActions {
  setAuth: (payload: {
    status: AuthStatus
    userId: string | null
    displayName: string | null
  }) => void
  setUserDataStatus: (status: UserDataStatus) => void
  setProgress: (progress: UserProgress | null) => void
  setSessions: (sessions: FocusSession[]) => void
  setActiveSessionId: (sessionId: string | null) => void
  setPendingStepBackTargetMinutes: (minutes: number | null) => void
  setDayPlanDraft: (dayPlanDraft: string) => void
  setFocusPlanDraft: (focusPlanDraft: string) => void
  setFocusPageIndex: (focusPageIndex: number) => void
  setFocusSnapshots: (focusSnapshots: FocusPlanSnapshot[]) => void
  setPlannerViewMode: (plannerViewMode: PlannerViewMode) => void
  focusGoPrev: () => void
  focusGoNext: () => void
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  authStatus: 'unknown',
  userId: null,
  displayName: null,
  userDataStatus: 'idle',
  progress: null,
  sessions: [],
  activeSessionId: null,
  pendingStepBackTargetMinutes: null,
  dayPlanDraft: '',
  focusPlanDraft: '',
  focusPageIndex: 0,
  focusSnapshots: [],
  plannerViewMode: 'live',
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setAuth: ({ status, userId, displayName }) =>
    set({ authStatus: status, userId, displayName }),
  setUserDataStatus: (userDataStatus) => set({ userDataStatus }),
  setProgress: (progress) => set({ progress }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  setPendingStepBackTargetMinutes: (pendingStepBackTargetMinutes) =>
    set({ pendingStepBackTargetMinutes }),
  setDayPlanDraft: (dayPlanDraft) => set({ dayPlanDraft }),
  setFocusPlanDraft: (focusPlanDraft) => set({ focusPlanDraft }),
  setFocusPageIndex: (focusPageIndex) => set({ focusPageIndex }),
  setFocusSnapshots: (focusSnapshots) => set({ focusSnapshots }),
  setPlannerViewMode: (plannerViewMode) => set({ plannerViewMode }),
  focusGoPrev: () =>
    set((state) => {
      if (!canFocusGoPrev(state.focusPageIndex)) return state
      return { focusPageIndex: state.focusPageIndex - 1 }
    }),
  focusGoNext: () =>
    set((state) => {
      if (
        !canFocusGoNext(
          state.focusPageIndex,
          state.focusSnapshots.length,
          state.plannerViewMode,
        )
      ) {
        return state
      }
      return { focusPageIndex: state.focusPageIndex + 1 }
    }),
}))
