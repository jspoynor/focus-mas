import { describe, expect, it } from 'vitest'
import {
  canFocusGoNext,
  canFocusGoPrev,
  clampFocusPageIndex,
  formatFocusSessionHeader,
  getDefaultFocusPageIndex,
  getFocusPageCount,
  getFocusPageSnapshot,
  getFocusPageText,
  getFocusSessionOutcomeStatus,
  isFocusDraftPage,
  isFocusSnapshotPage,
  shouldShowFocusSessionOutcome,
} from './plannerPages'

describe('getFocusPageCount', () => {
  it('includes the draft page in live mode when the draft slot is visible', () => {
    expect(getFocusPageCount(0, 'live')).toBe(1)
    expect(getFocusPageCount(3, 'live')).toBe(4)
  })

  it('hides the draft page in live mode while a session is in progress', () => {
    expect(getFocusPageCount(1, 'live', false)).toBe(1)
    expect(getFocusPageCount(3, 'live', false)).toBe(3)
  })

  it('counts snapshots only in snapshot mode', () => {
    expect(getFocusPageCount(0, 'snapshot')).toBe(0)
    expect(getFocusPageCount(3, 'snapshot')).toBe(3)
  })
})

describe('focus paging bounds', () => {
  it('disables prev on the first page and next on the last page in live mode', () => {
    const snapshotCount = 2
    const lastPage = getDefaultFocusPageIndex(snapshotCount, 'live')

    expect(canFocusGoPrev(0)).toBe(false)
    expect(canFocusGoNext(0, snapshotCount, 'live')).toBe(true)
    expect(canFocusGoNext(lastPage, snapshotCount, 'live')).toBe(false)
  })

  it('clamps out-of-range page indices', () => {
    expect(clampFocusPageIndex(9, 2, 'live')).toBe(2)
    expect(clampFocusPageIndex(-1, 2, 'live')).toBe(0)
    expect(clampFocusPageIndex(1, 0, 'snapshot')).toBe(0)
  })
})

describe('focus page content', () => {
  const snapshots = [{ planText: 'first' }, { planText: 'second' }]

  it('shows snapshot text on archived pages and draft text on the last live page', () => {
    expect(getFocusPageText(0, snapshots, 'draft', 'live')).toBe('first')
    expect(getFocusPageText(2, snapshots, 'draft', 'live')).toBe('draft')
  })

  it('marks snapshot pages read-only and the draft page editable in live mode', () => {
    expect(isFocusSnapshotPage(0, snapshots.length, 'live')).toBe(true)
    expect(isFocusSnapshotPage(2, snapshots.length, 'live')).toBe(false)
    expect(isFocusDraftPage(2, snapshots.length, 'live')).toBe(true)
  })
})

describe('formatFocusSessionHeader', () => {
  it('labels live pages as K of N + 1', () => {
    expect(formatFocusSessionHeader(0, 0, 'live')).toBe('Focus session · 1 of 1')
    expect(formatFocusSessionHeader(2, 2, 'live')).toBe('Focus session · 3 of 3')
  })
})

describe('focus session outcome', () => {
  const snapshots = [
    { sessionId: 'a', planText: 'first', startedAt: '2026-01-01T10:00:00.000Z' },
    { sessionId: 'b', planText: 'second', startedAt: '2026-01-01T11:00:00.000Z' },
  ]

  it('resolves canceled, uninterrupted, and interrupted outcomes from session records', () => {
    const sessions = [
      { id: 'a', distracted: false },
      { id: 'b', distracted: true },
    ]

    expect(getFocusSessionOutcomeStatus('a', sessions)).toBe('completed-uninterrupted')
    expect(getFocusSessionOutcomeStatus('b', sessions)).toBe('completed-interrupted')
    expect(getFocusSessionOutcomeStatus('missing', sessions)).toBe('canceled')
  })

  it('shows pending survey before session survey answers are loaded', () => {
    const sessions = [{ id: 'a', distracted: false }]

    expect(getFocusSessionOutcomeStatus('pending', sessions, 'pending')).toBe(
      'completed-pending-survey',
    )
    expect(getFocusSessionOutcomeStatus('a', sessions, 'pending')).toBe(
      'completed-uninterrupted',
    )
  })

  it('shows outcome labels only on archived snapshot pages', () => {
    expect(getFocusPageSnapshot(0, snapshots, 'live')?.sessionId).toBe('a')
    expect(getFocusPageSnapshot(2, snapshots, 'live')).toBeNull()

    expect(shouldShowFocusSessionOutcome(0, snapshots.length, 'live', 'a', null)).toBe(true)
    expect(shouldShowFocusSessionOutcome(0, snapshots.length, 'live', 'a', 'a')).toBe(false)
    expect(shouldShowFocusSessionOutcome(2, snapshots.length, 'live', undefined, null)).toBe(
      false,
    )
  })
})
