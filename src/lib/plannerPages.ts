export type PlannerViewMode = 'live' | 'snapshot'

/** Total focus arrow pages. Live mode includes the editable draft as the last page. */
export function getFocusPageCount(snapshotCount: number, mode: PlannerViewMode): number {
  if (mode === 'live') {
    return snapshotCount + 1
  }
  return snapshotCount
}

export function canFocusGoPrev(pageIndex: number): boolean {
  return pageIndex > 0
}

export function canFocusGoNext(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
): boolean {
  const pageCount = getFocusPageCount(snapshotCount, mode)
  return pageCount > 0 && pageIndex < pageCount - 1
}

/** Whether the page at `pageIndex` is the live editable draft (live mode only). */
export function isFocusDraftPage(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
): boolean {
  return mode === 'live' && pageIndex === snapshotCount
}

/** Default page after idle clear (live) or when opening a snapshot day. */
export function getDefaultFocusPageIndex(snapshotCount: number, mode: PlannerViewMode): number {
  const pageCount = getFocusPageCount(snapshotCount, mode)
  return pageCount > 0 ? pageCount - 1 : 0
}

export function formatFocusSessionHeader(
  pageIndex: number,
  snapshotCount: number,
  mode: PlannerViewMode,
): string {
  const pageCount = getFocusPageCount(snapshotCount, mode)
  if (pageCount === 0) {
    return 'Focus session'
  }
  return `Focus session · ${pageIndex + 1} of ${pageCount}`
}

export function getFocusPageText(
  pageIndex: number,
  snapshots: ReadonlyArray<{ planText: string }>,
  focusDraft: string,
  mode: PlannerViewMode,
): string {
  if (isFocusDraftPage(pageIndex, snapshots.length, mode)) {
    return focusDraft
  }
  return snapshots[pageIndex]?.planText ?? ''
}
