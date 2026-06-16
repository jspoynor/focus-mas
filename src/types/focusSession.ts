/**
 * Provisional Firestore model — pending grill-me spec.
 * Fields and semantics may change after specs.md / roadmap.md are produced.
 */

/** Focus-length stage in minutes (e.g. 25 → 30 → …). */
export type FocusStageMinutes = number

export interface FocusSession {
  id: string
  startedAt: string
  durationMinutes: number
  completed: boolean
  distracted: boolean
  usedPhone: boolean
  stage: FocusStageMinutes
}
