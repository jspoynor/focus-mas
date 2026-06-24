import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { breakMinutes } from '../../lib/breakDuration'
import { formatCountdown } from '../../lib/formatCountdown'
import { appendFocusSnapshot, removeFocusSnapshot } from '../../lib/plannerDays'
import { startSessionCompleteAlert } from '../../lib/sessionAlerts'
import { readDesktopNotificationsDesired } from '../../lib/sessionNotificationsPreference'
import { completeSession, createSessionRef } from '../../lib/sessions'
import { useAppStore, type TimerMode } from '../../store/useAppStore'
import type { PendingSurveySession } from '../survey/PostSessionSurvey'

const DEFAULT_STAGE_MINUTES = 25

export interface TimerDevHandles {
  completeNow: () => void
  skipBreak: () => void
  getMode: () => TimerMode
  subscribeToModeChange: (listener: () => void) => () => void
}

interface TimerProps {
  compact?: boolean
  completed?: boolean
  onFocusComplete?: (session: PendingSurveySession) => void
  breakDurationMinutes?: number | null
  onBreakStarted?: () => void
  /** When set, focus sessions run for this many seconds instead of stage minutes. */
  shortDurationSeconds?: number | null
  /** Fired when the timer returns to the ready idle state after survey + break (or skip break). */
  onReturnToReady?: () => void
}

export const Timer = forwardRef<TimerDevHandles, TimerProps>(function Timer(
  {
    compact = false,
    completed = false,
    onFocusComplete,
    breakDurationMinutes = null,
    onBreakStarted,
    shortDurationSeconds = null,
    onReturnToReady,
  },
  ref,
) {
  const userId = useAppStore((s) => s.userId)
  const progress = useAppStore((s) => s.progress)
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId)
  const setTimerMode = useAppStore((s) => s.setTimerMode)

  const [mode, setMode] = useState<TimerMode>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(DEFAULT_STAGE_MINUTES)

  const endTimeRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartedAtRef = useRef<Date | null>(null)
  const tickRef = useRef<number | null>(null)
  const modeRef = useRef<TimerMode>('idle')
  const focusDurationRef = useRef(DEFAULT_STAGE_MINUTES)
  const onFocusCompleteRef = useRef(onFocusComplete)
  const onReturnToReadyRef = useRef(onReturnToReady)
  const modeListenersRef = useRef(new Set<() => void>())

  const stageMinutes = progress?.currentStageMinutes ?? DEFAULT_STAGE_MINUTES

  modeRef.current = mode
  focusDurationRef.current = focusDurationMinutes
  onFocusCompleteRef.current = onFocusComplete
  onReturnToReadyRef.current = onReturnToReady

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const resetToIdle = useCallback(
    (options?: { notifyReady?: boolean }) => {
      clearTick()
      endTimeRef.current = null
      sessionIdRef.current = null
      sessionStartedAtRef.current = null
      setActiveSessionId(null)
      setMode('idle')
      setRemainingSeconds(0)
      if (options?.notifyReady) {
        onReturnToReadyRef.current?.()
      }
    },
    [clearTick, setActiveSessionId],
  )

  const startBreak = useCallback(
    (completedFocusMinutes: number) => {
      const breakMins = breakMinutes(completedFocusMinutes)
      endTimeRef.current = Date.now() + breakMins * 60 * 1000
      setMode('break')
      setRemainingSeconds(breakMins * 60)
      onBreakStarted?.()
    },
    [onBreakStarted],
  )

  const finishFocusSession = useCallback(
    (sessionId: string, duration: number, startedAt: string) => {
      endTimeRef.current = null
      clearTick()
      setMode('idle')
      setRemainingSeconds(0)
      onFocusCompleteRef.current?.({
        sessionId,
        durationMinutes: duration,
        startedAt,
      })
    },
    [clearTick],
  )

  const handleFocusComplete = useCallback(() => {
    const sessionId = sessionIdRef.current
    const startedAt = sessionStartedAtRef.current
    const duration = focusDurationRef.current
    const startedAtIso =
      startedAt?.toISOString() ??
      new Date(Date.now() - duration * 60_000).toISOString()

    sessionIdRef.current = null
    sessionStartedAtRef.current = null
    setActiveSessionId(null)

    startSessionCompleteAlert({
      durationMinutes: duration,
      desktopNotificationsDesired: readDesktopNotificationsDesired(),
    })

    if (userId && sessionId && startedAt) {
      finishFocusSession(sessionId, duration, startedAtIso)
      void completeSession(userId, sessionId, startedAt, duration).catch((err) => {
        console.warn('[timer] Failed to persist session:', err)
      })
      return
    }

    if (onFocusCompleteRef.current) {
      finishFocusSession(sessionId ?? 'local', duration, startedAtIso)
      return
    }

    endTimeRef.current = null
    clearTick()
    startBreak(duration)
  }, [clearTick, finishFocusSession, setActiveSessionId, startBreak, userId])

  const startTicking = useCallback(() => {
    clearTick()
    tickRef.current = window.setInterval(() => {
      const endTime = endTimeRef.current
      if (endTime === null) return

      const nextRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRemainingSeconds(nextRemaining)

      if (nextRemaining > 0) return

      clearTick()

      if (modeRef.current === 'focus') {
        handleFocusComplete()
      } else if (modeRef.current === 'break') {
        endTimeRef.current = null
        setMode('idle')
        setRemainingSeconds(0)
        onReturnToReadyRef.current?.()
      }
    }, 200)
  }, [clearTick, handleFocusComplete])

  useEffect(() => {
    if (mode === 'focus' || mode === 'break') {
      startTicking()
    }
    return clearTick
  }, [mode, startTicking, clearTick])

  useEffect(() => {
    if (breakDurationMinutes === null || mode !== 'idle') return
    startBreak(breakDurationMinutes)
  }, [breakDurationMinutes, mode, startBreak])

  useEffect(() => () => clearTick(), [clearTick])

  useEffect(() => {
    setTimerMode(mode)
    for (const listener of modeListenersRef.current) {
      listener()
    }
  }, [mode, setTimerMode])

  useImperativeHandle(
    ref,
    () => ({
      completeNow: () => {
        if (modeRef.current !== 'focus') return
        endTimeRef.current = null
        setRemainingSeconds(0)
        handleFocusComplete()
      },
      skipBreak: () => {
        if (modeRef.current !== 'break') return
        resetToIdle({ notifyReady: true })
      },
      getMode: () => modeRef.current,
      subscribeToModeChange: (listener: () => void) => {
        modeListenersRef.current.add(listener)
        return () => {
          modeListenersRef.current.delete(listener)
        }
      },
    }),
    [handleFocusComplete, resetToIdle],
  )

  function handleStartFocus() {
    if (!userId || completed) return

    const duration = stageMinutes
    const timerSeconds = shortDurationSeconds ?? duration * 60
    const sessionRef = createSessionRef(userId)
    const startedAt = new Date()

    sessionIdRef.current = sessionRef.id
    sessionStartedAtRef.current = startedAt
    setFocusDurationMinutes(duration)
    setActiveSessionId(sessionRef.id)

    const {
      focusPlanDraft,
      liveDateKey,
      plannerViewMode,
      recordFocusSessionStart,
    } = useAppStore.getState()

    if (plannerViewMode === 'live') {
      recordFocusSessionStart({
        sessionId: sessionRef.id,
        planText: focusPlanDraft,
        startedAt: startedAt.toISOString(),
      })
      void appendFocusSnapshot(userId, liveDateKey, {
        sessionId: sessionRef.id,
        planText: focusPlanDraft,
        startedAt,
      }).catch((err) => {
        console.warn('[planner] Failed to save focus snapshot:', err)
      })
    }

    endTimeRef.current = Date.now() + timerSeconds * 1000
    setMode('focus')
    setRemainingSeconds(timerSeconds)
  }

  function handleStop() {
    if (modeRef.current === 'focus') {
      const sessionId = sessionIdRef.current
      if (userId && sessionId) {
        const { liveDateKey, plannerViewMode, recordFocusSessionStop } = useAppStore.getState()
        if (plannerViewMode === 'live') {
          recordFocusSessionStop(sessionId)
          void removeFocusSnapshot(userId, liveDateKey, sessionId).catch((err) => {
            console.warn('[planner] Failed to remove focus snapshot:', err)
          })
        }
      }
      resetToIdle()
      return
    }

    if (modeRef.current === 'break') {
      resetToIdle({ notifyReady: true })
    }
  }

  const isRunning = mode === 'focus' || mode === 'break'
  const displaySeconds = completed
    ? 0
    : mode === 'idle'
      ? stageMinutes * 60
      : remainingSeconds

  const modeLabel = completed
    ? 'Session complete'
    : mode === 'focus'
      ? 'Focus session'
      : mode === 'break'
        ? 'Break'
        : 'Ready'

  return (
    <section
      className={`w-full min-w-0 text-center transition-all duration-500 ease-out ${compact ? 'py-2' : 'py-4'}`}
      aria-label="Focus timer"
    >
      <p className="text-xs uppercase tracking-widest text-white/50">{modeLabel}</p>
      <p
        className={`timer-display mt-4 w-full max-w-full overflow-hidden font-bold tabular-nums tracking-tight text-white transition-all duration-500 ease-out ${
          compact ? 'timer-display--compact' : ''
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {completed ? formatCountdown(0) : formatCountdown(displaySeconds)}
      </p>
      <p className="mt-3 text-sm text-white/60">
        {completed
          ? `${focusDurationMinutes} min focus complete`
          : mode === 'idle'
            ? `${stageMinutes} min focus · ${breakMinutes(stageMinutes)} min break`
            : mode === 'focus'
              ? `${focusDurationMinutes} min focus`
              : `${breakMinutes(focusDurationMinutes)} min break`}
      </p>

      {!completed ? (
        <div className="mt-8 flex justify-center gap-3">
          {mode === 'idle' ? (
            <button
              type="button"
              onClick={handleStartFocus}
              disabled={!userId}
              className="glass-btn-oval text-sm font-medium text-white"
            >
              Start focus
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="glass-btn-oval text-sm font-medium text-white/90"
            >
              {mode === 'focus' ? 'Stop session' : 'Skip break'}
            </button>
          )}
        </div>
      ) : null}

      <p
        className={`mt-4 min-h-[1rem] text-xs text-white/45 ${
          isRunning && mode === 'focus' ? 'visible' : 'invisible'
        }`}
        aria-hidden={!(isRunning && mode === 'focus')}
      >
        Stopping early discards this session.
      </p>
    </section>
  )
})
