import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './firebase'
import type { FocusSession } from '../types'

function mapSessionDoc(id: string, data: DocumentData): FocusSession | null {
  if (
    data.distracted === null ||
    data.distracted === undefined ||
    data.q1Distracted === null ||
    data.q1Distracted === undefined ||
    data.q2UsedPhone === null ||
    data.q2UsedPhone === undefined
  ) {
    return null
  }

  const completedAt = data.completedAt?.toDate?.()
  const startedAt = data.startedAt?.toDate?.()

  if (!completedAt || !startedAt) return null

  return {
    id,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMinutes: data.durationMinutes,
    stage: data.stage,
    q1Distracted: data.q1Distracted,
    q2UsedPhone: data.q2UsedPhone,
    distracted: data.distracted,
  }
}

export async function loadCompletedSessions(userId: string): Promise<FocusSession[]> {
  const sessionsRef = collection(db, 'users', userId, 'sessions')
  const sessionsQuery = query(sessionsRef, orderBy('completedAt', 'desc'))
  const snap = await getDocs(sessionsQuery)

  return snap.docs
    .map((sessionDoc) => mapSessionDoc(sessionDoc.id, sessionDoc.data()))
    .filter((session): session is FocusSession => session !== null)
}

export function createSessionRef(userId: string): DocumentReference {
  return doc(collection(db, 'users', userId, 'sessions'))
}

export async function completeSession(
  userId: string,
  sessionId: string,
  startedAt: Date,
  durationMinutes: number,
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId)

  await setDoc(sessionRef, {
    startedAt: Timestamp.fromDate(startedAt),
    completedAt: serverTimestamp(),
    durationMinutes,
    stage: durationMinutes,
    q1Distracted: null,
    q2UsedPhone: null,
    distracted: null,
  })
}

export async function updateSessionSurvey(
  userId: string,
  sessionId: string,
  q1Distracted: boolean,
  q2UsedPhone: boolean,
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId)

  await setDoc(
    sessionRef,
    {
      q1Distracted,
      q2UsedPhone,
      distracted: q1Distracted || q2UsedPhone,
    },
    { merge: true },
  )
}
