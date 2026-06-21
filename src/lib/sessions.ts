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

export interface SessionSurveyUpdate {
  sessionId: string
  durationMinutes: number
  startedAt?: string
  q1Distracted: boolean
  q2UsedPhone: boolean
  completedAt?: string
}

function isSurveyComplete(session: FocusSession): boolean {
  return (
    session.distracted !== null &&
    session.q1Distracted !== null &&
    session.q2UsedPhone !== null
  )
}

function sortSessionsByCompletedAt(sessions: FocusSession[]): FocusSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )
}

/** Applies survey answers to the in-memory session list for immediate UI updates. */
export function applySurveyToSessions(
  sessions: FocusSession[],
  update: SessionSurveyUpdate,
): FocusSession[] {
  const completedAt = update.completedAt ?? new Date().toISOString()
  const startedAt =
    update.startedAt ??
    new Date(Date.now() - update.durationMinutes * 60_000).toISOString()
  const distracted = update.q1Distracted || update.q2UsedPhone

  const surveyedSession: FocusSession = {
    id: update.sessionId,
    startedAt,
    completedAt,
    durationMinutes: update.durationMinutes,
    stage: update.durationMinutes,
    q1Distracted: update.q1Distracted,
    q2UsedPhone: update.q2UsedPhone,
    distracted,
  }

  const existingIndex = sessions.findIndex((session) => session.id === update.sessionId)
  if (existingIndex === -1) {
    return sortSessionsByCompletedAt([surveyedSession, ...sessions])
  }

  const next = [...sessions]
  next[existingIndex] = { ...sessions[existingIndex], ...surveyedSession }
  return sortSessionsByCompletedAt(next)
}

/** Prefer locally synced survey-complete sessions when Firestore reloads lag behind writes. */
export function mergeReloadedSessions(
  reloaded: FocusSession[],
  local: FocusSession[],
): FocusSession[] {
  const localById = new Map(local.map((session) => [session.id, session]))
  const mergedById = new Map<string, FocusSession>()

  for (const session of reloaded) {
    const localSession = localById.get(session.id)
    if (localSession && isSurveyComplete(localSession) && !isSurveyComplete(session)) {
      mergedById.set(session.id, localSession)
    } else {
      mergedById.set(session.id, session)
    }
  }

  for (const localSession of local) {
    if (mergedById.has(localSession.id) || !isSurveyComplete(localSession)) continue
    mergedById.set(localSession.id, localSession)
  }

  return sortSessionsByCompletedAt([...mergedById.values()])
}

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
