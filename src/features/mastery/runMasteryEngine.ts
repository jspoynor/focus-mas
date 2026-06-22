import { canAdvance, computeCurrentStreak, nextStageMinutes } from '../../lib/mastery'
import { loadUserProgress, saveUserProgress } from '../../lib/progress'
import { loadCompletedSessions, mergeReloadedSessions } from '../../lib/sessions'
import { useAppStore } from '../../store/useAppStore'
import type { UserProgress } from '../../types'

export interface MasteryEngineResult {
  progress: UserProgress
  streak: number
}

export async function runMasteryEngineAfterSession(
  userId: string,
): Promise<MasteryEngineResult> {
  const [reloadedSessions, currentProgress] = await Promise.all([
    loadCompletedSessions(userId),
    loadUserProgress(userId),
  ])

  const { sessions: localSessions } = useAppStore.getState()
  const sessions = mergeReloadedSessions(reloadedSessions, localSessions)
  const streak = computeCurrentStreak(sessions, currentProgress.lastProgressionAt)

  let nextProgress: UserProgress = currentProgress

  if (canAdvance(streak, currentProgress.currentStageMinutes)) {
    nextProgress = {
      ...currentProgress,
      currentStageMinutes: nextStageMinutes(currentProgress.currentStageMinutes),
      lastProgressionAt: new Date().toISOString(),
    }
  }

  await saveUserProgress(userId, nextProgress)

  const { setProgress, setSessions } = useAppStore.getState()
  setProgress(nextProgress)
  setSessions(sessions)

  return { progress: nextProgress, streak }
}
