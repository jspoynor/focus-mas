import { useCallback, useEffect, useRef, useState } from 'react'
import { withTimeout } from '../../lib/async'
import { useDevToolbarOptional } from '../../dev/DevToolbarContext'
import { runMasteryEngineAfterSession } from '../mastery/runMasteryEngine'
import { PostSessionSurvey, type PendingSurveySession } from '../survey/PostSessionSurvey'
import { Timer, type TimerDevHandles } from '../timer/Timer'
import { updateSessionSurvey } from '../../lib/sessions'
import { useAppStore } from '../../store/useAppStore'

const SURVEY_EXIT_MS = 500
const SURVEY_SAVE_TIMEOUT_MS = 15_000

function finishSurveyTransition(
  pendingSurvey: PendingSurveySession,
  setSurveyExiting: (exiting: boolean) => void,
  setBreakDurationMinutes: (minutes: number) => void,
  setPendingSurvey: (session: PendingSurveySession | null) => void,
  setIsSubmittingSurvey: (submitting: boolean) => void,
): void {
  setSurveyExiting(true)

  window.setTimeout(() => {
    setBreakDurationMinutes(pendingSurvey.durationMinutes)
    setPendingSurvey(null)
    setSurveyExiting(false)
    setIsSubmittingSurvey(false)
  }, SURVEY_EXIT_MS)
}

export function CenterColumn() {
  const userId = useAppStore((s) => s.userId)
  const devToolbar = useDevToolbarOptional()
  const registerTimer = devToolbar?.registerTimer
  const registerSession = devToolbar?.registerSession
  const timerRef = useRef<TimerDevHandles>(null)

  const [pendingSurvey, setPendingSurvey] = useState<PendingSurveySession | null>(null)
  const [surveyExiting, setSurveyExiting] = useState(false)
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false)
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number | null>(null)

  const handleFocusComplete = useCallback((session: PendingSurveySession) => {
    setPendingSurvey(session)
    setSurveyExiting(false)
  }, [])

  const handleSurveySubmit = useCallback(
    async (answers: { q1Distracted: boolean; q2UsedPhone: boolean }) => {
      if (!userId || !pendingSurvey) return

      setIsSubmittingSurvey(true)

      try {
        await withTimeout(
          updateSessionSurvey(
            userId,
            pendingSurvey.sessionId,
            answers.q1Distracted,
            answers.q2UsedPhone,
          ),
          SURVEY_SAVE_TIMEOUT_MS,
          'Saving survey',
        )
      } catch (err) {
        console.warn('[survey] Failed to save answers:', err)
        setIsSubmittingSurvey(false)
        return
      }

      try {
        await withTimeout(
          runMasteryEngineAfterSession(userId),
          SURVEY_SAVE_TIMEOUT_MS,
          'Updating mastery',
        )
      } catch (err) {
        console.warn('[survey] Mastery update failed, continuing to break:', err)
      }

      finishSurveyTransition(
        pendingSurvey,
        setSurveyExiting,
        setBreakDurationMinutes,
        setPendingSurvey,
        setIsSubmittingSurvey,
      )
    },
    [pendingSurvey, userId],
  )

  const handleBreakStarted = useCallback(() => {
    setBreakDurationMinutes(null)
  }, [])

  const submitSurveyPreset = useCallback(
    (clean: boolean) => {
      void handleSurveySubmit({
        q1Distracted: !clean,
        q2UsedPhone: !clean,
      })
    },
    [handleSurveySubmit],
  )

  useEffect(() => {
    if (!registerTimer) return
    registerTimer(timerRef.current)
  }, [registerTimer, pendingSurvey, isSubmittingSurvey, breakDurationMinutes])

  useEffect(() => {
    return () => registerTimer?.(null)
  }, [registerTimer])

  useEffect(() => {
    if (!registerSession) return

    registerSession({
      pendingSurvey,
      submitSurvey: submitSurveyPreset,
      isSubmitting: isSubmittingSurvey,
    })
  }, [registerSession, pendingSurvey, isSubmittingSurvey, submitSurveyPreset])

  useEffect(() => {
    return () => registerSession?.(null)
  }, [registerSession])

  const shortDurationSeconds =
    devToolbar?.shortDurationEnabled ? devToolbar.shortDurationSeconds : null

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <Timer
        ref={timerRef}
        compact={pendingSurvey !== null}
        completed={pendingSurvey !== null}
        onFocusComplete={handleFocusComplete}
        breakDurationMinutes={breakDurationMinutes}
        onBreakStarted={handleBreakStarted}
        shortDurationSeconds={shortDurationSeconds}
      />
      {pendingSurvey ? (
        <PostSessionSurvey
          session={pendingSurvey}
          isExiting={surveyExiting}
          onSubmit={handleSurveySubmit}
          isSubmitting={isSubmittingSurvey}
        />
      ) : null}
    </div>
  )
}
