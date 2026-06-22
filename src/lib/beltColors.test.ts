import { describe, expect, it } from 'vitest'
import { getStageLadder } from './beltColors'
import { MAX_STAGE_MINUTES, MIN_STAGE_MINUTES, STAGE_INCREMENT } from './mastery'

describe('getStageLadder', () => {
  it('lists every stage from 25 to 90 with a color', () => {
    const ladder = getStageLadder()
    const expectedCount = (MAX_STAGE_MINUTES - MIN_STAGE_MINUTES) / STAGE_INCREMENT + 1

    expect(ladder).toHaveLength(expectedCount)
    expect(ladder[0]).toEqual({ minutes: 25, color: expect.any(String) })
    expect(ladder[ladder.length - 1]?.minutes).toBe(90)
  })
})
