import { create } from 'zustand'
import type { FocusSession, UserProgress } from '../types'

export type AuthStatus = 'unknown' | 'signed-out' | 'signed-in'

export interface AppState {
  authStatus: AuthStatus
  userId: string | null
  displayName: string | null
  progress: UserProgress | null
  sessions: FocusSession[]
  /** Active focus session id while timer is running; null when idle. */
  activeSessionId: string | null
}

export interface AppActions {
  // TODO(grill-me): wire Firebase auth listeners and Firestore sync.
  setAuth: (payload: {
    status: AuthStatus
    userId: string | null
    displayName: string | null
  }) => void
  setProgress: (progress: UserProgress | null) => void
  setSessions: (sessions: FocusSession[]) => void
  setActiveSessionId: (sessionId: string | null) => void
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  authStatus: 'unknown',
  userId: null,
  displayName: null,
  progress: null,
  sessions: [],
  activeSessionId: null,
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setAuth: ({ status, userId, displayName }) =>
    set({ authStatus: status, userId, displayName }),
  setProgress: (progress) => set({ progress }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
}))
