import { describe, expect, it } from 'vitest'
import { isPlannerSnapshotEligible, toDateKey } from './calendarGrid'

describe('isPlannerSnapshotEligible', () => {
  const today = new Date(2026, 5, 19)

  it('includes today so the today cell returns to live planning', () => {
    expect(isPlannerSnapshotEligible(today, today)).toBe(true)
  })

  it('includes past days', () => {
    const yesterday = new Date(2026, 5, 18)
    expect(isPlannerSnapshotEligible(yesterday, today)).toBe(true)
  })

  it('excludes future days', () => {
    const tomorrow = new Date(2026, 5, 20)
    expect(isPlannerSnapshotEligible(tomorrow, today)).toBe(false)
    expect(toDateKey(tomorrow) > toDateKey(today)).toBe(true)
  })
})
