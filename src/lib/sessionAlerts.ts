import { playSessionCompleteCue } from './sessionAudio'
import { shouldShowDesktopNotification } from './sessionNotificationsPreference'

export const SESSION_ALERT_REPEAT_MS = 4_000
export const SESSION_ALERT_CAP_MS = 15 * 60_000
const NOTIFICATION_TAG = 'focus-session-complete'

interface ActiveSessionAlert {
  repeatTimerId: number
  capTimerId: number
  notification: Notification | null
}

let activeAlert: ActiveSessionAlert | null = null
let dismissListenerAttached = false

function handleDismissPointerDown(): void {
  stopSessionCompleteAlert()
}

function attachDismissListener(): void {
  if (dismissListenerAttached) return
  document.addEventListener('pointerdown', handleDismissPointerDown, true)
  dismissListenerAttached = true
}

function detachDismissListener(): void {
  if (!dismissListenerAttached) return
  document.removeEventListener('pointerdown', handleDismissPointerDown, true)
  dismissListenerAttached = false
}

function closeNotification(notification: Notification | null): void {
  if (!notification) return
  notification.onclick = null
  notification.onclose = null
  notification.close()
}

function showDesktopNotification(durationMinutes: number): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }
  if (Notification.permission !== 'granted') {
    return null
  }

  try {
    const notification = new Notification('Focus session complete', {
      body: `${durationMinutes} min focus done — time for your survey.`,
      tag: NOTIFICATION_TAG,
      requireInteraction: true,
    })

    notification.onclick = () => {
      window.focus()
      stopSessionCompleteAlert()
    }

    notification.onclose = () => {
      stopSessionCompleteAlert()
    }

    return notification
  } catch {
    return null
  }
}

export function startSessionCompleteAlert(options: {
  durationMinutes: number
  desktopNotificationsDesired: boolean
}): void {
  stopSessionCompleteAlert()

  const { durationMinutes, desktopNotificationsDesired } = options
  const desktopNotificationsEnabled = shouldShowDesktopNotification(desktopNotificationsDesired)

  const playCycle = () => {
    playSessionCompleteCue()
  }

  playCycle()

  let notification: Notification | null = null
  if (desktopNotificationsEnabled) {
    notification = showDesktopNotification(durationMinutes)
  }

  const repeatTimerId = window.setInterval(playCycle, SESSION_ALERT_REPEAT_MS)
  const capTimerId = window.setTimeout(() => {
    stopSessionCompleteAlert()
  }, SESSION_ALERT_CAP_MS)

  activeAlert = {
    repeatTimerId,
    capTimerId,
    notification,
  }

  attachDismissListener()
}

export function stopSessionCompleteAlert(): void {
  if (!activeAlert) return

  window.clearInterval(activeAlert.repeatTimerId)
  window.clearTimeout(activeAlert.capTimerId)
  closeNotification(activeAlert.notification)
  activeAlert = null

  detachDismissListener()
}

export function isSessionAlertActive(): boolean {
  return activeAlert !== null
}
