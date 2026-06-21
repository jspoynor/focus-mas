import type { FocusPlanSnapshot, FocusSession } from '../types'

export type PlannerViewMode = 'live' | 'snapshot'

export type FocusSessionOutcomeStatus =
  | 'canceled'
  | 'completed-pending-survey'
  | 'completed-uninterrupted'
  | 'completed-interrupted'

export const FOCUS_SESSION_OUTCOME_LABELS: Record<FocusSessionOutcomeStatus, string> = {
  canceled: 'Canceled',
  'completed-pending-survey': 'Completed – pending survey',
  'completed-uninterrupted': 'Completed – uninterrupted',
  'completed-interrupted': 'Completed – interrupted',
}

/** Total focus arrow pages. Live mode includes the editable draft as the last page when visible. */
export function getFocusPageCount(
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): number {
  if (mode === 'live') {
    if (!draftSlotVisible && snapshotCount > 0) {
      return snapshotCount
    }
    return snapshotCount + 1
  }
  return snapshotCount
}

export function clampFocusPageIndex(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): number {
  const pageCount = getFocusPageCount(snapshotCount, mode, draftSlotVisible)
  if (pageCount === 0) return 0
  return Math.min(Math.max(0, pageIndex), pageCount - 1)
}

export function canFocusGoPrev(pageIndex: number): boolean {
  return pageIndex > 0
}

export function canFocusGoNext(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): boolean {
  const pageCount = getFocusPageCount(snapshotCount, mode, draftSlotVisible)
  return pageCount > 0 && pageIndex < pageCount - 1
}

/** Whether the page at `pageIndex` is the live editable draft (live mode only). */
export function isFocusDraftPage(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): boolean {
  if (mode !== 'live' || !draftSlotVisible) return false
  return pageIndex === snapshotCount
}

/** Whether the page at `pageIndex` shows an archived focus snapshot (read-only). */
export function isFocusSnapshotPage(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): boolean {
  return (
    pageIndex >= 0 &&
    pageIndex < snapshotCount &&
    !isFocusDraftPage(pageIndex, snapshotCount, mode, draftSlotVisible)
  )
}

/** Default page after idle clear (live) or when opening a snapshot day. */
export function getDefaultFocusPageIndex(
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): number {
  const pageCount = getFocusPageCount(snapshotCount, mode, draftSlotVisible)
  return pageCount > 0 ? pageCount - 1 : 0
}

export function formatFocusSessionHeader(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): string {
  const pageCount = getFocusPageCount(snapshotCount, mode, draftSlotVisible)
  if (pageCount === 0) {
    return 'Focus session'
  }
  return `Focus session ${pageIndex + 1}/${pageCount}`
}

export function getFocusPageSnapshot(
  pageIndex: number,
  snapshots: ReadonlyArray<FocusPlanSnapshot>,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): FocusPlanSnapshot | null {
  if (!isFocusSnapshotPage(pageIndex, snapshots.length, mode, draftSlotVisible)) {
    return null
  }
  return snapshots[pageIndex] ?? null
}

export function getFocusPageText(
  pageIndex: number,
  snapshots: ReadonlyArray<{ planText: string }>,
  focusDraft: string,
  mode: PlannerViewMode,
  draftSlotVisible = true,
): string {
  if (isFocusDraftPage(pageIndex, snapshots.length, mode, draftSlotVisible)) {
    return focusDraft
  }
  return snapshots[pageIndex]?.planText ?? ''
}

export function getFocusSessionOutcomeStatus(
  sessionId: string,
  sessions: ReadonlyArray<Pick<FocusSession, 'id' | 'distracted'>>,
  pendingSurveySessionId: string | null = null,
): FocusSessionOutcomeStatus {
  if (pendingSurveySessionId === sessionId) {
    return 'completed-pending-survey'
  }

  const session = sessions.find((entry) => entry.id === sessionId)
  if (!session) {
    return 'canceled'
  }
  return session.distracted ? 'completed-interrupted' : 'completed-uninterrupted'
}

/** Show outcome for archived snapshot pages, excluding the in-flight focus session. */
export function shouldShowFocusSessionOutcome(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
  sessionId: string | undefined,
  activeSessionId: string | null,
  draftSlotVisible = true,
): boolean {
  if (!sessionId) return false
  if (!isFocusSnapshotPage(pageIndex, snapshotCount, mode, draftSlotVisible)) return false
  return activeSessionId !== sessionId
}
