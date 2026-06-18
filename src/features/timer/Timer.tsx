import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { breakMinutes } from '../../lib/breakDuration'
import { formatCountdown } from '../../lib/formatCountdown'
import { playSessionCompleteCue } from '../../lib/sessionAudio'
import { completeSession, createSessionRef } from '../../lib/sessions'
import type { PendingSurveySession } from '../survey/PostSessionSurvey'
import { useAppStore } from '../../store/useAppStore'

type TimerMode = 'idle' | 'focus' | 'break'

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
}

export const Timer = forwardRef<TimerDevHandles, TimerProps>(function Timer(
  {
    compact = false,
    completed = false,
    onFocusComplete,
    breakDurationMinutes = null,
    onBreakStarted,
    shortDurationSeconds = null,
  },
  ref,
) {
  const userId = useAppStore((s) => s.userId)
  const progress = useAppStore((s) => s.progress)
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId)

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
  const modeListenersRef = useRef(new Set<() => void>())

  const stageMinutes = progress?.currentStageMinutes ?? DEFAULT_STAGE_MINUTES

  modeRef.current = mode
  focusDurationRef.current = focusDurationMinutes
  onFocusCompleteRef.current = onFocusComplete

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const resetToIdle = useCallback(() => {
    clearTick()
    endTimeRef.current = null
    sessionIdRef.current = null
    sessionStartedAtRef.current = null
    setActiveSessionId(null)
    setMode('idle')
    setRemainingSeconds(0)
  }, [clearTick, setActiveSessionId])

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
    (sessionId: string, duration: number) => {
      endTimeRef.current = null
      clearTick()
      setMode('idle')
      setRemainingSeconds(0)
      onFocusCompleteRef.current?.({ sessionId, durationMinutes: duration })
    },
    [clearTick],
  )

  const handleFocusComplete = useCallback(() => {
    const sessionId = sessionIdRef.current
    const startedAt = sessionStartedAtRef.current
    const duration = focusDurationRef.current

    sessionIdRef.current = null
    sessionStartedAtRef.current = null
    setActiveSessionId(null)

    playSessionCompleteCue()

    if (userId && sessionId && startedAt) {
      finishFocusSession(sessionId, duration)
      void completeSession(userId, sessionId, startedAt, duration).catch((err) => {
        console.warn('[timer] Failed to persist session:', err)
      })
      return
    }

    if (onFocusCompleteRef.current) {
      finishFocusSession(sessionId ?? 'local', duration)
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
    for (const listener of modeListenersRef.current) {
      listener()
    }
  }, [mode])

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
        resetToIdle()
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

    sessionIdRef.current = sessionRef.id
    sessionStartedAtRef.current = new Date()
    setFocusDurationMinutes(duration)
    setActiveSessionId(sessionRef.id)

    endTimeRef.current = Date.now() + timerSeconds * 1000
    setMode('focus')
    setRemainingSeconds(timerSeconds)
  }

  function handleStop() {
    resetToIdle()
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
      className={`text-center transition-all duration-500 ease-out ${compact ? 'py-2' : 'py-4'}`}
      aria-label="Focus timer"
    >
      <p className="text-xs uppercase tracking-widest text-white/50">{modeLabel}</p>
      <p
        className={`mt-4 font-bold tabular-nums tracking-tight text-white transition-all duration-500 ease-out ${
          compact ? 'text-5xl sm:text-6xl' : 'text-9xl sm:text-[10rem] lg:text-[12rem]'
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
