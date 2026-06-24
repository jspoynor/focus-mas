import { create } from 'zustand'
import { toDateKey } from '../lib/calendarGrid'
import {
  canFocusGoNext,
  canFocusGoPrev,
  clampFocusPageIndex,
  getDefaultFocusPageIndex,
  type PlannerViewMode,
} from '../lib/plannerPages'
import { applySurveyToSessions, type SessionSurveyUpdate } from '../lib/sessions'
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
  dayPlanDraft: string
  focusPlanDraft: string
  focusPageIndex: number
  focusSnapshots: FocusPlanSnapshot[]
  /** When false, live mode hides the editable draft page until break/idle planning. */
  focusDraftSlotVisible: boolean
  plannerViewMode: PlannerViewMode
  /** When set, the planner shows archived data for this date (read-only). */
  snapshotDateKey: string | null
  /** Local date key for live today editing (YYYY-MM-DD). */
  liveDateKey: string
  dayPlanSaveStatus: DayPlanSaveStatus
  timerMode: TimerMode
  /** True while the post-session survey is visible (focus plan stays locked). */
  surveyActive: boolean
  /** Session awaiting post-session survey answers; null when survey is closed. */
  pendingSurveySessionId: string | null
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
  applySessionSurvey: (update: SessionSurveyUpdate) => void
  setActiveSessionId: (sessionId: string | null) => void
  setDayPlanDraft: (dayPlanDraft: string) => void
  setFocusPlanDraft: (focusPlanDraft: string) => void
  setFocusPageIndex: (focusPageIndex: number) => void
  setFocusSnapshots: (focusSnapshots: FocusPlanSnapshot[]) => void
  setPlannerViewMode: (plannerViewMode: PlannerViewMode) => void
  setLiveDateKey: (liveDateKey: string) => void
  setDayPlanSaveStatus: (dayPlanSaveStatus: DayPlanSaveStatus) => void
  setTimerMode: (timerMode: TimerMode) => void
  setSurveyState: (payload: {
    surveyActive: boolean
    pendingSurveySessionId: string | null
  }) => void
  recordFocusSessionStart: (snapshot: FocusPlanSnapshot) => void
  recordFocusSessionStop: (sessionId: string) => void
  updateFocusSnapshotPlanText: (sessionId: string, planText: string) => void
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
  dayPlanDraft: '',
  focusPlanDraft: '',
  focusPageIndex: 0,
  focusSnapshots: [],
  focusDraftSlotVisible: true,
  plannerViewMode: 'live',
  snapshotDateKey: null,
  liveDateKey: toDateKey(new Date()),
  dayPlanSaveStatus: 'idle',
  timerMode: 'idle',
  surveyActive: false,
  pendingSurveySessionId: null,
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setAuth: ({ status, userId, displayName }) =>
    set({ authStatus: status, userId, displayName }),
  setUserDataStatus: (userDataStatus) => set({ userDataStatus }),
  setProgress: (progress) => set({ progress }),
  setSessions: (sessions) => set({ sessions }),
  applySessionSurvey: (update) =>
    set((state) => ({
      sessions: applySurveyToSessions(state.sessions, update),
    })),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
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
        state.focusDraftSlotVisible,
      ),
    })),
  setPlannerViewMode: (plannerViewMode) => set({ plannerViewMode }),
  setLiveDateKey: (liveDateKey) => set({ liveDateKey }),
  setDayPlanSaveStatus: (dayPlanSaveStatus) => set({ dayPlanSaveStatus }),
  setTimerMode: (timerMode) => set({ timerMode }),
  setSurveyState: ({ surveyActive, pendingSurveySessionId }) =>
    set({ surveyActive, pendingSurveySessionId }),
  recordFocusSessionStart: (snapshot) =>
    set((state) => {
      const focusSnapshots = [...state.focusSnapshots, snapshot]
      const focusDraftSlotVisible = false
      return {
        focusSnapshots,
        focusPlanDraft: '',
        focusDraftSlotVisible,
        focusPageIndex: clampFocusPageIndex(
          focusSnapshots.length - 1,
          focusSnapshots.length,
          state.plannerViewMode,
          focusDraftSlotVisible,
        ),
      }
    }),
  recordFocusSessionStop: (sessionId) =>
    set((state) => {
      const removed = state.focusSnapshots.find((entry) => entry.sessionId === sessionId)
      const focusSnapshots = state.focusSnapshots.filter(
        (entry) => entry.sessionId !== sessionId,
      )
      const focusDraftSlotVisible = true
      return {
        focusSnapshots,
        focusPlanDraft: removed?.planText ?? state.focusPlanDraft,
        focusDraftSlotVisible,
        focusPageIndex: clampFocusPageIndex(
          getDefaultFocusPageIndex(
            focusSnapshots.length,
            state.plannerViewMode,
            focusDraftSlotVisible,
          ),
          focusSnapshots.length,
          state.plannerViewMode,
          focusDraftSlotVisible,
        ),
      }
    }),
  updateFocusSnapshotPlanText: (sessionId, planText) =>
    set((state) => ({
      focusSnapshots: state.focusSnapshots.map((snapshot) =>
        snapshot.sessionId === sessionId ? { ...snapshot, planText } : snapshot,
      ),
    })),
  recordFocusSessionCycleComplete: () =>
    set((state) => {
      const focusDraftSlotVisible = true
      return {
        focusDraftSlotVisible,
        focusPageIndex: clampFocusPageIndex(
          getDefaultFocusPageIndex(
            state.focusSnapshots.length,
            state.plannerViewMode,
            focusDraftSlotVisible,
          ),
          state.focusSnapshots.length,
          state.plannerViewMode,
          focusDraftSlotVisible,
        ),
      }
    }),
  hydrateLivePlannerDay: (plannerDay) =>
    set({
      snapshotDateKey: null,
      liveDateKey: plannerDay.dateKey,
      dayPlanDraft: plannerDay.dayPlan,
      focusSnapshots: plannerDay.focusSessions,
      focusPlanDraft: '',
      focusDraftSlotVisible: true,
      focusPageIndex: getDefaultFocusPageIndex(plannerDay.focusSessions.length, 'live', true),
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
      focusDraftSlotVisible: true,
      plannerViewMode: 'live',
      snapshotDateKey: null,
      liveDateKey: toDateKey(new Date()),
      dayPlanSaveStatus: 'idle',
      timerMode: 'idle',
      surveyActive: false,
      pendingSurveySessionId: null,
    }),
  applyLiveMidnightRollover: () =>
    set({
      liveDateKey: toDateKey(new Date()),
      dayPlanDraft: '',
      focusPlanDraft: '',
      focusSnapshots: [],
      focusDraftSlotVisible: true,
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
          state.focusDraftSlotVisible,
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
          state.focusDraftSlotVisible,
        )
      ) {
        return state
      }
      return {
        focusPageIndex: clampFocusPageIndex(
          state.focusPageIndex + 1,
          state.focusSnapshots.length,
          state.plannerViewMode,
          state.focusDraftSlotVisible,
        ),
      }
    }),
}))
