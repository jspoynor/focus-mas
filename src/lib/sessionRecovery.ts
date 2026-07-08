import { saveFocusSnapshots } from './plannerDays'
import { fetchSessionReconcileState } from './sessions'
import type { FocusSession, PendingSurveySession, PlannerDay } from '../types'

export interface SessionReconcileResult {
  /** Planner day with any cancelled (mid-focus) orphan snapshots removed. */
  plannerDay: PlannerDay
  /** Survey to re-show when the window closed while the survey was up; null otherwise. */
  restoredSurvey: PendingSurveySession | null
}

/**
 * Reconciles a focus session left dangling by a window close.
 *
 * A focus snapshot is written when a session starts, but the `sessions` doc is only
 * written when the timer completes, and survey answers only when the survey is submitted.
 * So on reopen a snapshot whose sessionId isn't among the fully-surveyed sessions is a
 * "suspect": we read its session doc to decide what happened.
 *
 * - No session doc  → closed mid-focus → cancel (delete snapshot, like Stop session).
 * - Survey-incomplete doc → closed during the survey → re-show the survey.
 * - Fully surveyed / read error → leave untouched (never cancel on uncertainty).
 *
 * Must only run on initial load with the timer idle — running it while a session is
 * active would treat that in-flight session as an orphan.
 */
export async function reconcileActiveSession(
  userId: string,
  plannerDay: PlannerDay,
  completedSessions: FocusSession[],
): Promise<SessionReconcileResult> {
  const completedIds = new Set(completedSessions.map((session) => session.id))
  const suspects = plannerDay.focusSessions.filter(
    (snapshot) => !completedIds.has(snapshot.sessionId),
  )

  if (suspects.length === 0) {
    return { plannerDay, restoredSurvey: null }
  }

  const cancelledIds = new Set<string>()
  let restoredSurvey: PendingSurveySession | null = null

  for (const snapshot of suspects) {
    const state = await fetchSessionReconcileState(userId, snapshot.sessionId)

    if (state.kind === 'missing') {
      cancelledIds.add(snapshot.sessionId)
    } else if (state.kind === 'incomplete') {
      const candidate: PendingSurveySession = {
        sessionId: snapshot.sessionId,
        durationMinutes: state.durationMinutes,
        startedAt: snapshot.startedAt,
      }
      // In practice only one session can be mid-survey; keep the most recent if not.
      if (
        !restoredSurvey ||
        new Date(candidate.startedAt).getTime() > new Date(restoredSurvey.startedAt).getTime()
      ) {
        restoredSurvey = candidate
      }
    }
  }

  if (cancelledIds.size === 0) {
    return { plannerDay, restoredSurvey }
  }

  const focusSessions = plannerDay.focusSessions.filter(
    (snapshot) => !cancelledIds.has(snapshot.sessionId),
  )

  try {
    await saveFocusSnapshots(userId, plannerDay.dateKey, focusSessions)
  } catch (err) {
    console.warn('[session-recovery] Failed to persist cancelled session:', err)
  }

  return { plannerDay: { ...plannerDay, focusSessions }, restoredSurvey }
}
