export const CURSOR_LIGHT_SCROLL_SETTLE_MS = 150
export const CURSOR_LIGHT_FPS_SLOW_MS = 32
export const CURSOR_LIGHT_FPS_FAST_MS = 20
export const CURSOR_LIGHT_FPS_SLOW_FRAME_COUNT = 3
export const CURSOR_LIGHT_FPS_FAST_FRAME_COUNT = 10

export type CursorLightSuppressionState = {
  pageVisible: boolean
  pageFocused: boolean
  lastScrollAt: number | null
  fpsTripped: boolean
  slowFrameCount: number
  fastFrameCount: number
  awaitingPointerMove: boolean
}

export type CursorLightSuppressionEvent =
  | { type: 'visibility'; visible: boolean }
  | { type: 'focus'; focused: boolean }
  | { type: 'scroll'; now: number }
  | { type: 'frame'; deltaMs: number }
  | { type: 'pointerMove' }

export function createInitialSuppressionState(
  overrides: Partial<CursorLightSuppressionState> = {},
): CursorLightSuppressionState {
  return {
    pageVisible: true,
    pageFocused: true,
    lastScrollAt: null,
    fpsTripped: false,
    slowFrameCount: 0,
    fastFrameCount: 0,
    awaitingPointerMove: false,
    ...overrides,
  }
}

function isPageEngaged(state: CursorLightSuppressionState): boolean {
  return state.pageVisible && state.pageFocused
}

function applyEngagementChange(
  state: CursorLightSuppressionState,
  nextVisible: boolean,
  nextFocused: boolean,
): CursorLightSuppressionState {
  const wasEngaged = isPageEngaged(state)
  const next = {
    ...state,
    pageVisible: nextVisible,
    pageFocused: nextFocused,
  }
  const engaged = isPageEngaged(next)

  if (!engaged) {
    return { ...next, awaitingPointerMove: false }
  }

  if (!wasEngaged && engaged) {
    return { ...next, awaitingPointerMove: true }
  }

  return next
}

function applyFrameDelta(
  state: CursorLightSuppressionState,
  deltaMs: number,
): CursorLightSuppressionState {
  if (deltaMs > CURSOR_LIGHT_FPS_SLOW_MS) {
    const slowFrameCount = state.slowFrameCount + 1
    return {
      ...state,
      slowFrameCount,
      fastFrameCount: 0,
      fpsTripped:
        slowFrameCount >= CURSOR_LIGHT_FPS_SLOW_FRAME_COUNT ? true : state.fpsTripped,
    }
  }

  if (deltaMs < CURSOR_LIGHT_FPS_FAST_MS) {
    const fastFrameCount = state.fastFrameCount + 1
    const fpsTripped =
      state.fpsTripped && fastFrameCount < CURSOR_LIGHT_FPS_FAST_FRAME_COUNT
    return {
      ...state,
      fastFrameCount,
      slowFrameCount: 0,
      fpsTripped,
    }
  }

  return {
    ...state,
    slowFrameCount: 0,
    fastFrameCount: 0,
  }
}

export function reduceCursorLightSuppression(
  state: CursorLightSuppressionState,
  event: CursorLightSuppressionEvent,
): CursorLightSuppressionState {
  switch (event.type) {
    case 'visibility':
      return applyEngagementChange(state, event.visible, state.pageFocused)
    case 'focus':
      return applyEngagementChange(state, state.pageVisible, event.focused)
    case 'scroll':
      return { ...state, lastScrollAt: event.now }
    case 'frame':
      return applyFrameDelta(state, event.deltaMs)
    case 'pointerMove':
      return isPageEngaged(state)
        ? { ...state, awaitingPointerMove: false }
        : state
    default:
      return state
  }
}

export function isScrollSuppressing(
  state: CursorLightSuppressionState,
  now: number,
): boolean {
  return (
    state.lastScrollAt !== null &&
    now - state.lastScrollAt < CURSOR_LIGHT_SCROLL_SETTLE_MS
  )
}

export function isCursorLightSuppressed(
  state: CursorLightSuppressionState,
  now: number,
): boolean {
  if (!isPageEngaged(state)) {
    return true
  }

  if (state.awaitingPointerMove) {
    return true
  }

  if (isScrollSuppressing(state, now)) {
    return true
  }

  if (state.fpsTripped) {
    return true
  }

  return false
}
