import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProgress } from '../types'

export const DEFAULT_PROGRESS: UserProgress = {
  currentStageMinutes: 25,
  lastProgressionAt: null,
  prevMasteryPercent: null,
  stepBackOfferedAt: null,
}

function parseProgressData(data: Record<string, unknown>): UserProgress {
  return {
    currentStageMinutes:
      typeof data.currentStageMinutes === 'number'
        ? data.currentStageMinutes
        : DEFAULT_PROGRESS.currentStageMinutes,
    lastProgressionAt:
      data.lastProgressionAt &&
      typeof data.lastProgressionAt === 'object' &&
      'toDate' in data.lastProgressionAt &&
      typeof data.lastProgressionAt.toDate === 'function'
        ? (data.lastProgressionAt as { toDate: () => Date }).toDate().toISOString()
        : null,
    prevMasteryPercent:
      typeof data.prevMasteryPercent === 'number' ? data.prevMasteryPercent : null,
    stepBackOfferedAt:
      data.stepBackOfferedAt &&
      typeof data.stepBackOfferedAt === 'object' &&
      'toDate' in data.stepBackOfferedAt &&
      typeof data.stepBackOfferedAt.toDate === 'function'
        ? (data.stepBackOfferedAt as { toDate: () => Date }).toDate().toISOString()
        : null,
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgress> {
  const snap = await getDoc(doc(db, 'users', userId, 'progress'))

  if (!snap.exists()) {
    return { ...DEFAULT_PROGRESS }
  }

  return parseProgressData(snap.data())
}

/** Creates the progress document on first sign-in if it does not exist. */
export async function ensureUserProgress(userId: string): Promise<UserProgress> {
  const ref = doc(db, 'users', userId, 'progress')
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      currentStageMinutes: DEFAULT_PROGRESS.currentStageMinutes,
      lastProgressionAt: null,
      prevMasteryPercent: null,
      stepBackOfferedAt: null,
    })
    return { ...DEFAULT_PROGRESS }
  }

  return parseProgressData(snap.data())
}

export async function saveUserProgress(
  userId: string,
  updates: Partial<UserProgress>,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'progress')
  const payload: Record<string, unknown> = {}

  if (updates.currentStageMinutes !== undefined) {
    payload.currentStageMinutes = updates.currentStageMinutes
  }
  if (updates.lastProgressionAt !== undefined) {
    payload.lastProgressionAt = updates.lastProgressionAt
      ? Timestamp.fromDate(new Date(updates.lastProgressionAt))
      : null
  }
  if (updates.prevMasteryPercent !== undefined) {
    payload.prevMasteryPercent = updates.prevMasteryPercent
  }
  if (updates.stepBackOfferedAt !== undefined) {
    payload.stepBackOfferedAt = updates.stepBackOfferedAt
      ? Timestamp.fromDate(new Date(updates.stepBackOfferedAt))
      : null
  }

  await setDoc(ref, payload, { merge: true })
}
