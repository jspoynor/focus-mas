import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SESSION_ALERT_CAP_MS,
  SESSION_ALERT_REPEAT_MS,
  isSessionAlertActive,
  startSessionCompleteAlert,
  stopSessionCompleteAlert,
} from './sessionAlerts'
import * as sessionAudio from './sessionAudio'

vi.mock('./sessionAudio', () => ({
  playSessionCompleteCue: vi.fn(),
}))

describe('sessionAlerts', () => {
  const eventListeners = new Map<string, Set<EventListener>>()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(sessionAudio.playSessionCompleteCue).mockClear()
    eventListeners.clear()

    vi.stubGlobal('window', {
      setInterval,
      clearInterval,
      setTimeout,
      clearTimeout,
      focus: vi.fn(),
      Notification: undefined,
    })

    vi.stubGlobal('document', {
      addEventListener: (type: string, listener: EventListener) => {
        const listeners = eventListeners.get(type) ?? new Set<EventListener>()
        listeners.add(listener)
        eventListeners.set(type, listeners)
      },
      removeEventListener: (type: string, listener: EventListener) => {
        eventListeners.get(type)?.delete(listener)
      },
    })
  })

  afterEach(() => {
    stopSessionCompleteAlert()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function dispatchPointerDown(): void {
    for (const listener of eventListeners.get('pointerdown') ?? []) {
      listener(new Event('pointerdown'))
    }
  }

  it('plays immediately and repeats on interval until dismissed', () => {
    startSessionCompleteAlert({
      durationMinutes: 25,
      desktopNotificationsDesired: false,
    })

    expect(sessionAudio.playSessionCompleteCue).toHaveBeenCalledTimes(1)
    expect(isSessionAlertActive()).toBe(true)

    vi.advanceTimersByTime(SESSION_ALERT_REPEAT_MS)
    expect(sessionAudio.playSessionCompleteCue).toHaveBeenCalledTimes(2)

    dispatchPointerDown()
    expect(isSessionAlertActive()).toBe(false)
    expect(sessionAudio.playSessionCompleteCue).toHaveBeenCalledTimes(2)
  })

  it('stops after the safety cap', () => {
    startSessionCompleteAlert({
      durationMinutes: 25,
      desktopNotificationsDesired: false,
    })

    vi.advanceTimersByTime(SESSION_ALERT_CAP_MS)
    expect(isSessionAlertActive()).toBe(false)
  })

  it('shows a desktop notification when enabled and permission is granted', () => {
    const close = vi.fn()
    class NotificationMock {
      static permission = 'granted' as NotificationPermission
      onclick: (() => void) | null = null
      onclose: (() => void) | null = null
      constructor(
        public title: string,
        public options?: NotificationOptions,
      ) {}
      close = close
    }

    vi.stubGlobal('Notification', NotificationMock)
    vi.stubGlobal('window', {
      setInterval,
      clearInterval,
      setTimeout,
      clearTimeout,
      focus: vi.fn(),
      Notification: NotificationMock,
    })

    startSessionCompleteAlert({
      durationMinutes: 30,
      desktopNotificationsDesired: true,
    })

    expect(close).not.toHaveBeenCalled()

    stopSessionCompleteAlert()
    expect(close).toHaveBeenCalled()
  })

  it('stops when the desktop notification is dismissed', () => {
    let activeNotification: { onclose: (() => void) | null; close: () => void } | null = null

    class NotificationMock {
      static permission = 'granted' as NotificationPermission
      onclick: (() => void) | null = null
      onclose: (() => void) | null = null
      constructor(
        public title: string,
        public options?: NotificationOptions,
      ) {
        activeNotification = this
      }
      close() {
        this.onclose?.()
      }
    }

    vi.stubGlobal('Notification', NotificationMock)
    vi.stubGlobal('window', {
      setInterval,
      clearInterval,
      setTimeout,
      clearTimeout,
      focus: vi.fn(),
      Notification: NotificationMock,
    })

    startSessionCompleteAlert({
      durationMinutes: 30,
      desktopNotificationsDesired: true,
    })

    expect(isSessionAlertActive()).toBe(true)
    activeNotification?.close()
    expect(isSessionAlertActive()).toBe(false)
  })
})
