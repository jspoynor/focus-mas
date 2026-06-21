import {
  canAdvance,
  computeRollingWindow,
  nextStageMinutes,
  previousStageMinutes,
  shouldOfferStepBack,
} from '../../lib/mastery'
import { loadUserProgress, saveUserProgress } from '../../lib/progress'
import { loadCompletedSessions, mergeReloadedSessions } from '../../lib/sessions'
import { useAppStore } from '../../store/useAppStore'
import type { UserProgress } from '../../types'

export interface MasteryEngineResult {
  progress: UserProgress
  stepBackTargetMinutes: number | null
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
  const window = computeRollingWindow(sessions)
  const newMasteryPercent = window.cleanRate
  const prevMasteryPercent = currentProgress.prevMasteryPercent

  let nextProgress: UserProgress = {
    ...currentProgress,
    prevMasteryPercent: newMasteryPercent,
  }

  let stepBackTargetMinutes: number | null = null

  if (canAdvance(window, currentProgress.currentStageMinutes)) {
    nextProgress = {
      ...nextProgress,
      currentStageMinutes: nextStageMinutes(currentProgress.currentStageMinutes),
      lastProgressionAt: new Date().toISOString(),
    }
  } else if (
    shouldOfferStepBack(newMasteryPercent, prevMasteryPercent) &&
    currentProgress.currentStageMinutes > previousStageMinutes(currentProgress.currentStageMinutes)
  ) {
    stepBackTargetMinutes = previousStageMinutes(currentProgress.currentStageMinutes)
    nextProgress = {
      ...nextProgress,
      stepBackOfferedAt: new Date().toISOString(),
    }
  }

  await saveUserProgress(userId, nextProgress)

  const { setProgress, setSessions, setPendingStepBackTargetMinutes } =
    useAppStore.getState()
  setProgress(nextProgress)
  setSessions(sessions)
  setPendingStepBackTargetMinutes(stepBackTargetMinutes)

  return { progress: nextProgress, stepBackTargetMinutes }
}

export async function acceptStepBackOffer(userId: string): Promise<void> {
  const { progress, pendingStepBackTargetMinutes, setProgress, setPendingStepBackTargetMinutes } =
    useAppStore.getState()

  if (!progress || pendingStepBackTargetMinutes === null) return

  const nextProgress: UserProgress = {
    ...progress,
    currentStageMinutes: pendingStepBackTargetMinutes,
  }

  await saveUserProgress(userId, {
    currentStageMinutes: nextProgress.currentStageMinutes,
  })

  setProgress(nextProgress)
  setPendingStepBackTargetMinutes(null)
}

export async function declineStepBackOffer(userId: string): Promise<void> {
  const { progress, setProgress, setPendingStepBackTargetMinutes } = useAppStore.getState()

  if (!progress) return

  const declinedAt = new Date().toISOString()
  const nextProgress: UserProgress = {
    ...progress,
    stepBackOfferedAt: declinedAt,
  }

  await saveUserProgress(userId, { stepBackOfferedAt: declinedAt })
  setProgress(nextProgress)
  setPendingStepBackTargetMinutes(null)
}
