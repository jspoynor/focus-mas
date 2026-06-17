import { useCallback, useState } from 'react'
import { runMasteryEngineAfterSession } from '../mastery/runMasteryEngine'
import { PostSessionSurvey, type PendingSurveySession } from '../survey/PostSessionSurvey'
import { Timer } from '../timer/Timer'
import { updateSessionSurvey } from '../../lib/sessions'
import { useAppStore } from '../../store/useAppStore'

const SURVEY_EXIT_MS = 500

export function CenterColumn() {
  const userId = useAppStore((s) => s.userId)

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
        await updateSessionSurvey(
          userId,
          pendingSurvey.sessionId,
          answers.q1Distracted,
          answers.q2UsedPhone,
        )
        await runMasteryEngineAfterSession(userId)
      } catch (err) {
        console.warn('[survey] Failed to save answers:', err)
        setIsSubmittingSurvey(false)
        return
      }

      setSurveyExiting(true)

      window.setTimeout(() => {
        setBreakDurationMinutes(pendingSurvey.durationMinutes)
        setPendingSurvey(null)
        setSurveyExiting(false)
        setIsSubmittingSurvey(false)
      }, SURVEY_EXIT_MS)
    },
    [pendingSurvey, userId],
  )

  const handleBreakStarted = useCallback(() => {
    setBreakDurationMinutes(null)
  }, [])

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <Timer
        compact={pendingSurvey !== null}
        completed={pendingSurvey !== null}
        onFocusComplete={handleFocusComplete}
        breakDurationMinutes={breakDurationMinutes}
        onBreakStarted={handleBreakStarted}
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
