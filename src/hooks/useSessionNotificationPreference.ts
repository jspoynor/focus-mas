import { useCallback, useState } from 'react'
import {
  getNotificationPermission,
  readDesktopNotificationsDesired,
  requestDesktopNotificationPermission,
  resolveBellVisualState,
  writeDesktopNotificationsDesired,
  type BellVisualState,
} from '../lib/sessionNotificationsPreference'

export function useSessionNotificationPreference() {
  const [desired, setDesired] = useState(() => readDesktopNotificationsDesired())
  const [permission, setPermission] = useState(() => getNotificationPermission())

  const bellState: BellVisualState = resolveBellVisualState(desired)

  const toggle = useCallback(async () => {
    if (desired) {
      writeDesktopNotificationsDesired(false)
      setDesired(false)
      return
    }

    writeDesktopNotificationsDesired(true)
    setDesired(true)

    const nextPermission = await requestDesktopNotificationPermission()
    setPermission(nextPermission === 'unsupported' ? 'unsupported' : getNotificationPermission())
  }, [desired])

  return {
    bellState,
    toggle,
    permission,
  }
}
