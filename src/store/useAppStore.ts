import { create } from 'zustand'
import { toDateKey } from '../lib/calendarGrid'
import {
  canFocusGoNext,
  canFocusGoPrev,
  clampFocusPageIndex,
  getDefaultFocusPageIndex,
  type PlannerViewMode,
} from '../lib/plannerPages'
import type { FocusPlanSnapshot, FocusSession, PlannerDay, UserProgress } from '../types'

export type DayPlanSaveStatus = 'idle' | 'pending' | 'saved' | 'error'
export type TimerMode = 'idle' | 'focus' | 'break'

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
  /** When set, the planner shows archived data for this date (read-only). */
  snapshotDateKey: string | null
  /** Local date key for live today editing (YYYY-MM-DD). */
  liveDateKey: string
  dayPlanSaveStatus: DayPlanSaveStatus
  timerMode: TimerMode
  /** True while the post-session survey is visible (focus plan stays locked). */
  surveyActive: boolean
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
  setLiveDateKey: (liveDateKey: string) => void
  setDayPlanSaveStatus: (dayPlanSaveStatus: DayPlanSaveStatus) => void
  setTimerMode: (timerMode: TimerMode) => void
  setSurveyActive: (surveyActive: boolean) => void
  recordFocusSessionStart: (snapshot: FocusPlanSnapshot) => void
  recordFocusSessionStop: (sessionId: string) => void
  recordFocusSessionCycleComplete: () => void
  hydrateLivePlannerDay: (plannerDay: PlannerDay) => void
  hydrateSnapshotPlannerDay: (plannerDay: PlannerDay) => void
  resetPlannerState: () => void
  applyLiveMidnightRollover: () => void
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
  snapshotDateKey: null,
  liveDateKey: toDateKey(new Date()),
  dayPlanSaveStatus: 'idle',
  timerMode: 'idle',
  surveyActive: false,
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
  setFocusSnapshots: (focusSnapshots) =>
    set((state) => ({
      focusSnapshots,
      focusPageIndex: clampFocusPageIndex(
        state.focusPageIndex,
        focusSnapshots.length,
        state.plannerViewMode,
      ),
    })),
  setPlannerViewMode: (plannerViewMode) => set({ plannerViewMode }),
  setLiveDateKey: (liveDateKey) => set({ liveDateKey }),
  setDayPlanSaveStatus: (dayPlanSaveStatus) => set({ dayPlanSaveStatus }),
  setTimerMode: (timerMode) => set({ timerMode }),
  setSurveyActive: (surveyActive) => set({ surveyActive }),
  recordFocusSessionStart: (snapshot) =>
    set((state) => {
      const focusSnapshots = [...state.focusSnapshots, snapshot]
      return {
        focusSnapshots,
        focusPageIndex: clampFocusPageIndex(
          focusSnapshots.length - 1,
          focusSnapshots.length,
          state.plannerViewMode,
        ),
      }
    }),
  recordFocusSessionStop: (sessionId) =>
    set((state) => {
      const removed = state.focusSnapshots.find((entry) => entry.sessionId === sessionId)
      const focusSnapshots = state.focusSnapshots.filter(
        (entry) => entry.sessionId !== sessionId,
      )
      return {
        focusSnapshots,
        focusPlanDraft: removed?.planText ?? state.focusPlanDraft,
        focusPageIndex: clampFocusPageIndex(
          getDefaultFocusPageIndex(focusSnapshots.length, 'live'),
          focusSnapshots.length,
          state.plannerViewMode,
        ),
      }
    }),
  recordFocusSessionCycleComplete: () =>
    set((state) => ({
      focusPlanDraft: '',
      focusPageIndex: clampFocusPageIndex(
        getDefaultFocusPageIndex(state.focusSnapshots.length, 'live'),
        state.focusSnapshots.length,
        state.plannerViewMode,
      ),
    })),
  hydrateLivePlannerDay: (plannerDay) =>
    set({
      snapshotDateKey: null,
      liveDateKey: plannerDay.dateKey,
      dayPlanDraft: plannerDay.dayPlan,
      focusSnapshots: plannerDay.focusSessions,
      focusPlanDraft: '',
      focusPageIndex: getDefaultFocusPageIndex(plannerDay.focusSessions.length, 'live'),
      plannerViewMode: 'live',
      dayPlanSaveStatus: 'idle',
    }),
  hydrateSnapshotPlannerDay: (plannerDay) =>
    set({
      snapshotDateKey: plannerDay.dateKey,
      dayPlanDraft: plannerDay.dayPlan,
      focusSnapshots: plannerDay.focusSessions,
      focusPlanDraft: '',
      focusPageIndex: getDefaultFocusPageIndex(plannerDay.focusSessions.length, 'snapshot'),
      plannerViewMode: 'snapshot',
      dayPlanSaveStatus: 'idle',
    }),
  resetPlannerState: () =>
    set({
      dayPlanDraft: '',
      focusPlanDraft: '',
      focusPageIndex: 0,
      focusSnapshots: [],
      plannerViewMode: 'live',
      snapshotDateKey: null,
      liveDateKey: toDateKey(new Date()),
      dayPlanSaveStatus: 'idle',
      timerMode: 'idle',
      surveyActive: false,
    }),
  applyLiveMidnightRollover: () =>
    set({
      liveDateKey: toDateKey(new Date()),
      dayPlanDraft: '',
      focusPlanDraft: '',
      focusSnapshots: [],
      focusPageIndex: 0,
      dayPlanSaveStatus: 'idle',
    }),
  focusGoPrev: () =>
    set((state) => {
      if (!canFocusGoPrev(state.focusPageIndex)) return state
      return {
        focusPageIndex: clampFocusPageIndex(
          state.focusPageIndex - 1,
          state.focusSnapshots.length,
          state.plannerViewMode,
        ),
      }
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
      return {
        focusPageIndex: clampFocusPageIndex(
          state.focusPageIndex + 1,
          state.focusSnapshots.length,
          state.plannerViewMode,
        ),
      }
    }),
}))
