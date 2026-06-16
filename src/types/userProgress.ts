/**
 * Provisional Firestore model — pending grill-me spec.
 * Fields and semantics may change after specs.md / roadmap.md are produced.
 */

import type { FocusStageMinutes } from './focusSession'

export interface UserProgress {
  userId: string
  currentStageMinutes: FocusStageMinutes
  /** ISO timestamp of last progression event, if any. */
  lastProgressionAt: string | null
  /** Rolling-window mastery rate (0–100). Business rules TBD in grill-me. */
  recentMasteryPercent: number | null
}
