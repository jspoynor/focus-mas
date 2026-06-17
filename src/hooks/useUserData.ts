import { useEffect } from 'react'
import { ensureUserProgress } from '../lib/progress'
import { loadCompletedSessions } from '../lib/sessions'
import { useAppStore } from '../store/useAppStore'

/** Loads progress and sessions when the user signs in. */
export function useUserData() {
  const authStatus = useAppStore((s) => s.authStatus)
  const userId = useAppStore((s) => s.userId)
  const setUserDataStatus = useAppStore((s) => s.setUserDataStatus)
  const setProgress = useAppStore((s) => s.setProgress)
  const setSessions = useAppStore((s) => s.setSessions)
  const setPendingStepBackTargetMinutes = useAppStore(
    (s) => s.setPendingStepBackTargetMinutes,
  )

  useEffect(() => {
    if (authStatus !== 'signed-in' || !userId) {
      setUserDataStatus('idle')
      setProgress(null)
      setSessions([])
      setPendingStepBackTargetMinutes(null)
      return
    }

    let cancelled = false
    setUserDataStatus('loading')

    Promise.all([ensureUserProgress(userId), loadCompletedSessions(userId)])
      .then(([progress, sessions]) => {
        if (!cancelled) {
          setProgress(progress)
          setSessions(sessions)
          setUserDataStatus('ready')
        }
      })
      .catch((err) => {
        console.warn('[user-data] Failed to load user data:', err)
        if (!cancelled) {
          setProgress({
            currentStageMinutes: 25,
            lastProgressionAt: null,
            prevMasteryPercent: null,
            stepBackOfferedAt: null,
          })
          setSessions([])
          setUserDataStatus('ready')
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    authStatus,
    userId,
    setUserDataStatus,
    setProgress,
    setSessions,
    setPendingStepBackTargetMinutes,
  ])
}
