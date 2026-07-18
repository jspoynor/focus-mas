import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { breakMinutes } from '../../lib/breakDuration'
import { appendFocusSnapshot, removeFocusSnapshot } from '../../lib/plannerDays'
import { startSessionCompleteAlert } from '../../lib/sessionAlerts'
import { readDesktopNotificationsDesired } from '../../lib/sessionNotificationsPreference'
import { completeSession, createSessionRef } from '../../lib/sessions'
import { useAppStore, type TimerMode } from '../../store/useAppStore'
import type { PendingSurveySession } from '../survey/PostSessionSurvey'
import { TimerDisplay, type TimerAction } from './TimerDisplay'

const DEFAULT_STAGE_MINUTES = 25

export interface TimerDevHandles {
  completeNow: () => void
  skipBreak: () => void
  getMode: () => TimerMode
  subscribeToModeChange: (listener: () => void) => () => void
  /**
   * Re-enter focus for `durationSeconds` more on the same session ("snooze"). The base
   * session is already banked; this only extends working time and never changes the
   * logged duration. Valid only while the post-session survey is up (timer idle).
   */
  snooze: (
    durationSeconds: number,
    session: { sessionId: string; startedAt: string; durationMinutes: number },
  ) => void
}

interface TimerProps {
  compact?: boolean
  completed?: boolean
  /** Duration to show in the completed-state label; falls back to the live session length. */
  completedDurationMinutes?: number | null
  /** Action rendered in the completed state (e.g. the snooze button while the survey is up). */
  completedAction?: TimerAction | null
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
    completedDurationMinutes = null,
    completedAction = null,
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
  // True while running a "+5 more minutes" bonus round; the base session is already banked.
  const snoozeRoundRef = useRef(false)
  // Length of the current bonus round, for its sub-label (dev mode can make it seconds).
  const snoozeSecondsRef = useRef(0)
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
      snoozeRoundRef.current = false
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

  const handleFocusComplete = useCallback((options?: { silent?: boolean }) => {
    const sessionId = sessionIdRef.current
    const startedAt = sessionStartedAtRef.current
    const duration = focusDurationRef.current
    const startedAtIso =
      startedAt?.toISOString() ??
      new Date(Date.now() - duration * 60_000).toISOString()

    sessionIdRef.current = null
    sessionStartedAtRef.current = null
    setActiveSessionId(null)

    // `silent` skips the completion alert when the user manually ends a bonus round —
    // they already clicked Stop, so re-arming the beep loop would be noise.
    if (!options?.silent) {
      startSessionCompleteAlert({
        durationMinutes: duration,
        desktopNotificationsDesired: readDesktopNotificationsDesired(),
      })
    }

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
      snooze: (durationSeconds, session) => {
        // Only valid straight off a focus completion, while the survey is up (timer idle).
        if (modeRef.current !== 'idle') return

        snoozeRoundRef.current = true
        snoozeSecondsRef.current = durationSeconds
        sessionIdRef.current = session.sessionId
        sessionStartedAtRef.current = new Date(session.startedAt)
        // Pin the logged duration to the banked stage value so a re-completion re-writes
        // the same duration (option B: bonus time is never recorded).
        setFocusDurationMinutes(session.durationMinutes)
        setActiveSessionId(session.sessionId)

        endTimeRef.current = Date.now() + durationSeconds * 1000
        setMode('focus')
        setRemainingSeconds(durationSeconds)
      },
      getMode: () => modeRef.current,
      subscribeToModeChange: (listener: () => void) => {
        modeListenersRef.current.add(listener)
        return () => {
          modeListenersRef.current.delete(listener)
        }
      },
    }),
    [handleFocusComplete, resetToIdle, setActiveSessionId],
  )

  function handleStartFocus() {
    if (!userId || completed) return

    snoozeRoundRef.current = false
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
      // In a bonus round the base session is already banked — ending early doesn't
      // discard it, it just finishes the extra time and returns to the survey.
      if (snoozeRoundRef.current) {
        endTimeRef.current = null
        clearTick()
        handleFocusComplete({ silent: true })
        return
      }

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
  // Hidden during bonus rounds: the base session is already banked, so stopping won't discard it.
  const showDiscardWarning = isRunning && mode === 'focus' && !snoozeRoundRef.current
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

  const isSnoozeRound = mode === 'focus' && snoozeRoundRef.current
  const snoozeSeconds = snoozeSecondsRef.current
  const snoozeLengthLabel =
    snoozeSeconds % 60 === 0 ? `${snoozeSeconds / 60} bonus min` : `${snoozeSeconds} bonus sec`

  const subLabel = completed
    ? `${completedDurationMinutes ?? focusDurationMinutes} min focus complete`
    : mode === 'idle'
      ? `${stageMinutes} min focus · ${breakMinutes(stageMinutes)} min break`
      : mode === 'focus'
        ? isSnoozeRound
          ? `+${snoozeLengthLabel} · session saved`
          : `${focusDurationMinutes} min focus`
        : `${breakMinutes(focusDurationMinutes)} min break`

  const action: TimerAction | null = completed
    ? completedAction
    : mode === 'idle'
      ? { label: 'Start focus', onClick: handleStartFocus, disabled: !userId }
      : {
          label:
            mode === 'focus' ? (isSnoozeRound ? 'Start survey' : 'Stop session') : 'Skip break',
          onClick: handleStop,
          muted: true,
        }

  return (
    <TimerDisplay
      compact={compact}
      modeLabel={modeLabel}
      displaySeconds={displaySeconds}
      subLabel={subLabel}
      action={action}
      showDiscardWarning={showDiscardWarning}
    />
  )
})
