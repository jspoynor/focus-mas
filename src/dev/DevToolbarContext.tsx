import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PendingSurveySession } from '../features/survey/PostSessionSurvey'
import type { TimerDevHandles } from '../features/timer/Timer'

export interface SessionDevHandles {
  pendingSurvey: PendingSurveySession | null
  submitSurvey: (clean: boolean) => void
  isSubmitting: boolean
}

interface DevToolbarContextValue {
  timer: TimerDevHandles | null
  session: SessionDevHandles | null
  registerTimer: (handles: TimerDevHandles | null) => void
  registerSession: (handles: SessionDevHandles | null) => void
  shortDurationEnabled: boolean
  setShortDurationEnabled: (enabled: boolean) => void
  shortDurationSeconds: number
  setShortDurationSeconds: (seconds: number) => void
  toolbarOpen: boolean
  setToolbarOpen: (open: boolean) => void
  toggleToolbar: () => void
}

const DevToolbarContext = createContext<DevToolbarContextValue | null>(null)

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function isBacktickKey(event: KeyboardEvent): boolean {
  return event.code === 'Backquote' || event.key === '`' || event.key === '~'
}

export function DevToolbarProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<TimerDevHandles | null>(null)
  const [session, setSession] = useState<SessionDevHandles | null>(null)
  const [shortDurationEnabled, setShortDurationEnabled] = useState(false)
  const [shortDurationSeconds, setShortDurationSeconds] = useState(10)
  const [toolbarOpen, setToolbarOpen] = useState(false)

  const registerTimer = useCallback((handles: TimerDevHandles | null) => {
    setTimer((prev) => (prev === handles ? prev : handles))
  }, [])

  const registerSession = useCallback((handles: SessionDevHandles | null) => {
    setSession((prev) => {
      if (prev === handles) return prev
      if (!prev || !handles) return handles
      if (
        prev.pendingSurvey === handles.pendingSurvey &&
        prev.submitSurvey === handles.submitSurvey &&
        prev.isSubmitting === handles.isSubmitting
      ) {
        return prev
      }
      return handles
    })
  }, [])

  const toggleToolbar = useCallback(() => {
    setToolbarOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isBacktickKey(event) || event.repeat || isTypingTarget(event.target)) return
      event.preventDefault()
      toggleToolbar()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleToolbar])

  const value = useMemo(
    () => ({
      timer,
      session,
      registerTimer,
      registerSession,
      shortDurationEnabled,
      setShortDurationEnabled,
      shortDurationSeconds,
      setShortDurationSeconds,
      toolbarOpen,
      setToolbarOpen,
      toggleToolbar,
    }),
    [
      timer,
      session,
      registerTimer,
      registerSession,
      shortDurationEnabled,
      shortDurationSeconds,
      toolbarOpen,
      toggleToolbar,
    ],
  )

  return <DevToolbarContext.Provider value={value}>{children}</DevToolbarContext.Provider>
}

export function useDevToolbar(): DevToolbarContextValue {
  const ctx = useContext(DevToolbarContext)
  if (!ctx) {
    throw new Error('useDevToolbar must be used within DevToolbarProvider')
  }
  return ctx
}

export function useDevToolbarOptional(): DevToolbarContextValue | null {
  return useContext(DevToolbarContext)
}
