import { doc, getDoc, setDoc, Timestamp, type DocumentReference } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProgress } from '../types'

/** Single progress doc: users/{userId}/progress/main (Firestore paths need an even segment count). */
const PROGRESS_DOC_ID = 'main'

function progressRef(userId: string): DocumentReference {
  return doc(db, 'users', userId, 'progress', PROGRESS_DOC_ID)
}

export const DEFAULT_PROGRESS: UserProgress = {
  currentStageMinutes: 25,
  lastProgressionAt: null,
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
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgress> {
  const snap = await getDoc(progressRef(userId))

  if (!snap.exists()) {
    return { ...DEFAULT_PROGRESS }
  }

  return parseProgressData(snap.data())
}

/** Creates the progress document on first sign-in if it does not exist. */
export async function ensureUserProgress(userId: string): Promise<UserProgress> {
  const ref = progressRef(userId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      currentStageMinutes: DEFAULT_PROGRESS.currentStageMinutes,
      lastProgressionAt: null,
    })
    return { ...DEFAULT_PROGRESS }
  }

  return parseProgressData(snap.data())
}

export async function saveUserProgress(
  userId: string,
  updates: Partial<UserProgress>,
): Promise<void> {
  const ref = progressRef(userId)
  const payload: Record<string, unknown> = {}

  if (updates.currentStageMinutes !== undefined) {
    payload.currentStageMinutes = updates.currentStageMinutes
  }
  if (updates.lastProgressionAt !== undefined) {
    payload.lastProgressionAt = updates.lastProgressionAt
      ? Timestamp.fromDate(new Date(updates.lastProgressionAt))
      : null
  }

  await setDoc(ref, payload, { merge: true })
}
