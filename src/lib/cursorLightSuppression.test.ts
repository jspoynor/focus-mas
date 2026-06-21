import { describe, expect, it } from 'vitest'
import {
  createInitialSuppressionState,
  CURSOR_LIGHT_FPS_FAST_FRAME_COUNT,
  CURSOR_LIGHT_FPS_SLOW_FRAME_COUNT,
  CURSOR_LIGHT_SCROLL_SETTLE_MS,
  isCursorLightSuppressed,
  isScrollSuppressing,
  reduceCursorLightSuppression,
} from './cursorLightSuppression'

describe('scroll suppression', () => {
  it('suppresses until settle time after the last scroll', () => {
    const state = reduceCursorLightSuppression(createInitialSuppressionState(), {
      type: 'scroll',
      now: 1000,
    })

    expect(isScrollSuppressing(state, 1000)).toBe(true)
    expect(isScrollSuppressing(state, 1000 + CURSOR_LIGHT_SCROLL_SETTLE_MS - 1)).toBe(true)
    expect(isScrollSuppressing(state, 1000 + CURSOR_LIGHT_SCROLL_SETTLE_MS)).toBe(false)
  })

  it('extends suppression when scroll events keep arriving', () => {
    let state = reduceCursorLightSuppression(createInitialSuppressionState(), {
      type: 'scroll',
      now: 1000,
    })
    state = reduceCursorLightSuppression(state, { type: 'scroll', now: 1100 })

    expect(isScrollSuppressing(state, 1100 + CURSOR_LIGHT_SCROLL_SETTLE_MS - 1)).toBe(true)
    expect(isScrollSuppressing(state, 1100 + CURSOR_LIGHT_SCROLL_SETTLE_MS)).toBe(false)
  })

  it('clears scroll suppression immediately after settle without pointer move', () => {
    let state = reduceCursorLightSuppression(createInitialSuppressionState(), {
      type: 'scroll',
      now: 0,
    })
    const settledAt = CURSOR_LIGHT_SCROLL_SETTLE_MS

    expect(isCursorLightSuppressed(state, settledAt)).toBe(false)
  })
})

describe('focus and visibility gate', () => {
  it('suppresses when the page is hidden or unfocused', () => {
    const hidden = reduceCursorLightSuppression(createInitialSuppressionState(), {
      type: 'visibility',
      visible: false,
    })
    const unfocused = reduceCursorLightSuppression(createInitialSuppressionState(), {
      type: 'focus',
      focused: false,
    })

    expect(isCursorLightSuppressed(hidden, 0)).toBe(true)
    expect(isCursorLightSuppressed(unfocused, 0)).toBe(true)
  })

  it('requires pointer move after returning to a visible focused page', () => {
    let state = createInitialSuppressionState()
    state = reduceCursorLightSuppression(state, { type: 'focus', focused: false })
    state = reduceCursorLightSuppression(state, { type: 'focus', focused: true })

    expect(isCursorLightSuppressed(state, 0)).toBe(true)

    state = reduceCursorLightSuppression(state, { type: 'pointerMove' })

    expect(isCursorLightSuppressed(state, 0)).toBe(false)
  })

  it('requires pointer move after the tab becomes visible again', () => {
    let state = createInitialSuppressionState({ pageFocused: false })
    state = reduceCursorLightSuppression(state, { type: 'visibility', visible: false })
    state = reduceCursorLightSuppression(state, { type: 'focus', focused: true })
    state = reduceCursorLightSuppression(state, { type: 'visibility', visible: true })

    expect(isCursorLightSuppressed(state, 0)).toBe(true)

    state = reduceCursorLightSuppression(state, { type: 'pointerMove' })

    expect(isCursorLightSuppressed(state, 0)).toBe(false)
  })
})

describe('fps watchdog', () => {
  it('trips after consecutive slow frames', () => {
    let state = createInitialSuppressionState()

    for (let i = 0; i < CURSOR_LIGHT_FPS_SLOW_FRAME_COUNT; i++) {
      state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 40 })
    }

    expect(state.fpsTripped).toBe(true)
    expect(isCursorLightSuppressed(state, 0)).toBe(true)
  })

  it('recovers after consecutive fast frames', () => {
    let state = createInitialSuppressionState()

    for (let i = 0; i < CURSOR_LIGHT_FPS_SLOW_FRAME_COUNT; i++) {
      state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 40 })
    }

    for (let i = 0; i < CURSOR_LIGHT_FPS_FAST_FRAME_COUNT - 1; i++) {
      state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 10 })
      expect(state.fpsTripped).toBe(true)
    }

    state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 10 })

    expect(state.fpsTripped).toBe(false)
    expect(isCursorLightSuppressed(state, 0)).toBe(false)
  })

  it('resets slow-frame counting after a fast frame', () => {
    let state = createInitialSuppressionState()
    state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 40 })
    state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 40 })
    state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 10 })
    state = reduceCursorLightSuppression(state, { type: 'frame', deltaMs: 40 })

    expect(state.fpsTripped).toBe(false)
  })
})
