import {
  collection,
  getDocs,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_PROGRESS, saveUserProgress } from './progress'

const BATCH_LIMIT = 500

function sessionsCollection(userId: string) {
  return collection(db, 'users', userId, 'sessions')
}

/** Counts every document under users/{userId}/sessions (including incomplete). */
export async function countUserSessions(userId: string): Promise<number> {
  const snap = await getDocs(sessionsCollection(userId))
  return snap.size
}

async function deleteAllUserSessions(userId: string): Promise<number> {
  const snap = await getDocs(sessionsCollection(userId))
  const refs: DocumentReference[] = snap.docs.map((sessionDoc) => sessionDoc.ref)

  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) {
      batch.delete(ref)
    }
    await batch.commit()
  }

  return refs.length
}

async function resetUserProgressToDefaults(userId: string): Promise<void> {
  await saveUserProgress(userId, { ...DEFAULT_PROGRESS })
}

/** Deletes all sessions and resets progress to defaults. */
export async function resetUserAccount(userId: string): Promise<{ deletedSessionCount: number }> {
  const deletedSessionCount = await deleteAllUserSessions(userId)
  await resetUserProgressToDefaults(userId)
  return { deletedSessionCount }
}
