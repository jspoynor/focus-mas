import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './firebase'
import type { FocusPlanSnapshot, PlannerDay } from '../types'

const BATCH_LIMIT = 500

export function emptyPlannerDay(dateKey: string): PlannerDay {
  return {
    dateKey,
    dayPlan: '',
    focusSessions: [],
    updatedAt: null,
  }
}

export function plannerDayRef(userId: string, dateKey: string): DocumentReference {
  return doc(db, 'users', userId, 'plannerDays', dateKey)
}

function plannerDaysCollection(userId: string) {
  return collection(db, 'users', userId, 'plannerDays')
}

function parseFocusSnapshot(data: DocumentData): FocusPlanSnapshot | null {
  if (typeof data.sessionId !== 'string' || typeof data.planText !== 'string') {
    return null
  }

  const startedAt = data.startedAt?.toDate?.()
  if (!startedAt) return null

  return {
    sessionId: data.sessionId,
    planText: data.planText,
    startedAt: startedAt.toISOString(),
  }
}

function parsePlannerDayData(dateKey: string, data: DocumentData): PlannerDay {
  const dayPlan = typeof data.dayPlan === 'string' ? data.dayPlan : ''
  const rawSessions = Array.isArray(data.focusSessions) ? data.focusSessions : []
  const focusSessions = rawSessions
    .map((entry) => parseFocusSnapshot(entry as DocumentData))
    .filter((snapshot): snapshot is FocusPlanSnapshot => snapshot !== null)

  const updatedAt =
    data.updatedAt &&
    typeof data.updatedAt === 'object' &&
    'toDate' in data.updatedAt &&
    typeof data.updatedAt.toDate === 'function'
      ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
      : null

  return {
    dateKey,
    dayPlan,
    focusSessions,
    updatedAt,
  }
}

function focusSnapshotsToFirestore(snapshots: FocusPlanSnapshot[]): DocumentData[] {
  return snapshots.map((snapshot) => ({
    sessionId: snapshot.sessionId,
    planText: snapshot.planText,
    startedAt: Timestamp.fromDate(new Date(snapshot.startedAt)),
  }))
}

export async function loadPlannerDay(userId: string, dateKey: string): Promise<PlannerDay> {
  const snap = await getDoc(plannerDayRef(userId, dateKey))

  if (!snap.exists()) {
    return emptyPlannerDay(dateKey)
  }

  return parsePlannerDayData(dateKey, snap.data())
}

export async function saveDayPlan(
  userId: string,
  dateKey: string,
  dayPlan: string,
): Promise<void> {
  await setDoc(
    plannerDayRef(userId, dateKey),
    {
      dayPlan,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function appendFocusSnapshot(
  userId: string,
  dateKey: string,
  snapshot: { sessionId: string; planText: string; startedAt: Date },
): Promise<void> {
  const existing = await loadPlannerDay(userId, dateKey)
  const nextSnapshot: FocusPlanSnapshot = {
    sessionId: snapshot.sessionId,
    planText: snapshot.planText,
    startedAt: snapshot.startedAt.toISOString(),
  }

  await setDoc(
    plannerDayRef(userId, dateKey),
    {
      focusSessions: focusSnapshotsToFirestore([...existing.focusSessions, nextSnapshot]),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeFocusSnapshot(
  userId: string,
  dateKey: string,
  sessionId: string,
): Promise<void> {
  const existing = await loadPlannerDay(userId, dateKey)
  const focusSessions = existing.focusSessions.filter(
    (snapshot) => snapshot.sessionId !== sessionId,
  )

  await setDoc(
    plannerDayRef(userId, dateKey),
    {
      focusSessions: focusSnapshotsToFirestore(focusSessions),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function countPlannerDays(userId: string): Promise<number> {
  const snap = await getDocs(plannerDaysCollection(userId))
  return snap.size
}

export async function deleteAllPlannerDays(userId: string): Promise<number> {
  const snap = await getDocs(plannerDaysCollection(userId))
  const refs = snap.docs.map((plannerDoc) => plannerDoc.ref)

  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) {
      batch.delete(ref)
    }
    await batch.commit()
  }

  return refs.length
}
