const STORAGE_KEY = 'focus-mas-desktop-notifications'

export type BellVisualState = 'off' | 'on' | 'blocked'

export function readDesktopNotificationsDesired(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function writeDesktopNotificationsDesired(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export function resolveBellVisualState(desired: boolean): BellVisualState {
  if (!desired) return 'off'

  const permission = getNotificationPermission()
  if (permission === 'granted') return 'on'
  return 'blocked'
}

export function shouldShowDesktopNotification(desired: boolean): boolean {
  return desired && getNotificationPermission() === 'granted'
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.requestPermission()
}
