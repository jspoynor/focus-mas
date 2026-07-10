import { describe, expect, it } from 'vitest'
import {
  DEMO_STAGE_MINUTES,
  DEMO_STREAK,
  STATIC_STATE,
  TOTAL_SECONDS,
  tickCountdown,
} from './useDemoLoop'

const NOW = 1_000_000

describe('tickCountdown', () => {
  it('reports the whole seconds left against the anchor', () => {
    const endTime = NOW + 25 * 60 * 1000
    expect(tickCountdown(endTime, NOW).remainingSeconds).toBe(TOTAL_SECONDS)
    expect(tickCountdown(endTime, NOW).endTime).toBe(endTime)
  })

  it('counts down one second per real second, holding the same anchor', () => {
    const endTime = NOW + TOTAL_SECONDS * 1000
    expect(tickCountdown(endTime, NOW + 1000).remainingSeconds).toBe(TOTAL_SECONDS - 1)
    expect(tickCountdown(endTime, NOW + 10_000).remainingSeconds).toBe(TOTAL_SECONDS - 10)
    expect(tickCountdown(endTime, NOW + 10_000).endTime).toBe(endTime)
  })

  it('quietly resets to a full session at zero, with a fresh anchor', () => {
    const endTime = NOW + TOTAL_SECONDS * 1000
    const atZero = tickCountdown(endTime, endTime)
    expect(atZero.remainingSeconds).toBe(TOTAL_SECONDS)
    expect(atZero.endTime).toBe(endTime + TOTAL_SECONDS * 1000)
  })

  it('never reports a negative time, even if the tab wakes up well past zero', () => {
    const endTime = NOW + TOTAL_SECONDS * 1000
    const late = tickCountdown(endTime, endTime + 90_000)
    expect(late.remainingSeconds).toBe(TOTAL_SECONDS)
    expect(late.remainingSeconds).toBeGreaterThanOrEqual(0)
  })

  it('walks a full cycle without ever leaving 0..TOTAL_SECONDS', () => {
    let endTime = NOW + TOTAL_SECONDS * 1000
    let now = NOW
    for (let i = 0; i < TOTAL_SECONDS + 30; i++) {
      now += 1000
      const next = tickCountdown(endTime, now)
      endTime = next.endTime
      expect(next.remainingSeconds).toBeGreaterThanOrEqual(0)
      expect(next.remainingSeconds).toBeLessThanOrEqual(TOTAL_SECONDS)
    }
  })
})

describe('demo constants', () => {
  it('is a real 25-minute session', () => {
    expect(TOTAL_SECONDS).toBe(DEMO_STAGE_MINUTES * 60)
    expect(DEMO_STAGE_MINUTES).toBe(25)
  })

  it('reduced motion rests at a still, full 25:00 with the static streak', () => {
    expect(STATIC_STATE.remainingSeconds).toBe(TOTAL_SECONDS)
    expect(STATIC_STATE.streak).toBe(DEMO_STREAK)
  })
})
