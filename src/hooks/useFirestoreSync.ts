import { useEffect, useState } from 'react'
import { waitForPendingWrites } from 'firebase/firestore'
import { db } from '../lib/firebase'

const LAST_ONLINE_KEY = 'focus-mastery-last-online'
const OFFLINE_GAP_MS = 24 * 60 * 60 * 1000
const ONLINE_HEARTBEAT_MS = 5 * 60 * 1000

function readLastOnline(): number {
  const raw = localStorage.getItem(LAST_ONLINE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function writeLastOnline(timestamp: number): void {
  localStorage.setItem(LAST_ONLINE_KEY, String(timestamp))
}

/** Shows "Syncing..." after reconnecting from an offline gap longer than 24 hours. */
export function useFirestoreSyncIndicator(): boolean {
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    function handleOnline() {
      const lastOnline = readLastOnline()
      const gap = Date.now() - lastOnline

      if (gap > OFFLINE_GAP_MS) {
        setIsSyncing(true)
        void waitForPendingWrites(db)
          .then(() => setIsSyncing(false))
          .catch(() => setIsSyncing(false))
      }

      writeLastOnline(Date.now())
    }

    if (navigator.onLine) {
      writeLastOnline(Date.now())
    }

    window.addEventListener('online', handleOnline)

    const heartbeat = window.setInterval(() => {
      if (navigator.onLine) {
        writeLastOnline(Date.now())
      }
    }, ONLINE_HEARTBEAT_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.clearInterval(heartbeat)
    }
  }, [])

  return isSyncing
}
