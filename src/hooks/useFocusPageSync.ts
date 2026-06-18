import { useEffect } from 'react'
import { clampFocusPageIndex } from '../lib/plannerPages'
import { useAppStore } from '../store/useAppStore'

/** Keeps focus page index in bounds when snapshot count or view mode changes. */
export function useFocusPageSync() {
  const focusPageIndex = useAppStore((s) => s.focusPageIndex)
  const snapshotCount = useAppStore((s) => s.focusSnapshots.length)
  const plannerViewMode = useAppStore((s) => s.plannerViewMode)

  useEffect(() => {
    const clamped = clampFocusPageIndex(focusPageIndex, snapshotCount, plannerViewMode)
    if (clamped !== focusPageIndex) {
      useAppStore.getState().setFocusPageIndex(clamped)
    }
  }, [focusPageIndex, snapshotCount, plannerViewMode])
}
