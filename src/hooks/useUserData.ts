import { useEffect } from 'react'
import { defaultUserDataFallback, loadUserData } from '../lib/loadUserData'
import { useAppStore } from '../store/useAppStore'

/** Loads progress and sessions when the user signs in. */
export function useUserData() {
  const authStatus = useAppStore((s) => s.authStatus)
  const userId = useAppStore((s) => s.userId)

  useEffect(() => {
    const {
      setUserDataStatus,
      setProgress,
      setSessions,
      setPendingStepBackTargetMinutes,
      hydrateLivePlannerDay,
      resetPlannerState,
    } = useAppStore.getState()

    if (authStatus !== 'signed-in' || !userId) {
      setUserDataStatus('idle')
      setProgress(null)
      setSessions([])
      setPendingStepBackTargetMinutes(null)
      resetPlannerState()
      return
    }

    let cancelled = false
    setUserDataStatus('loading')

    void loadUserData(userId)
      .then(({ progress, sessions, plannerDay }) => {
        if (cancelled) return
        setProgress(progress)
        setSessions(sessions)
        hydrateLivePlannerDay(plannerDay)
        setUserDataStatus('ready')
      })
      .catch((err) => {
        console.warn('[user-data] Failed to load user data:', err)
        if (cancelled) return
        const fallback = defaultUserDataFallback()
        setProgress(fallback.progress)
        setSessions(fallback.sessions)
        hydrateLivePlannerDay(fallback.plannerDay)
        setUserDataStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [authStatus, userId])
}
