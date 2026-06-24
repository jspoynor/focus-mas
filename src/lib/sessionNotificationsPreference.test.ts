import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readDesktopNotificationsDesired,
  resolveBellVisualState,
  shouldShowDesktopNotification,
  writeDesktopNotificationsDesired,
} from './sessionNotificationsPreference'

describe('sessionNotificationsPreference', () => {
  const storage = new Map<string, string>()
  let notificationStub: {
    permission: NotificationPermission
    requestPermission: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    storage.clear()
    notificationStub = {
      permission: 'default',
      requestPermission: vi.fn(),
    }
    vi.stubGlobal('Notification', notificationStub)
    vi.stubGlobal('window', { Notification: notificationStub })
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      clear: () => storage.clear(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists desktop notification preference', () => {
    expect(readDesktopNotificationsDesired()).toBe(false)
    writeDesktopNotificationsDesired(true)
    expect(readDesktopNotificationsDesired()).toBe(true)
  })

  it('resolves bell visual states', () => {
    expect(resolveBellVisualState(false)).toBe('off')

    writeDesktopNotificationsDesired(true)
    expect(resolveBellVisualState(true)).toBe('blocked')

    Object.defineProperty(notificationStub, 'permission', { value: 'granted' })
    expect(resolveBellVisualState(true)).toBe('on')

    Object.defineProperty(notificationStub, 'permission', { value: 'denied' })
    expect(resolveBellVisualState(true)).toBe('blocked')
  })

  it('only shows desktop notifications when desired and granted', () => {
    expect(shouldShowDesktopNotification(false)).toBe(false)

    writeDesktopNotificationsDesired(true)
    Object.defineProperty(notificationStub, 'permission', { value: 'default' })
    expect(shouldShowDesktopNotification(true)).toBe(false)

    Object.defineProperty(notificationStub, 'permission', { value: 'granted' })
    expect(shouldShowDesktopNotification(true)).toBe(true)
  })
})
