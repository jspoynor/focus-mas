import { useEffect } from 'react'
import { defaultUserDataFallback, loadUserData } from '../lib/loadUserData'
import { reconcileActiveSession } from '../lib/sessionRecovery'
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
      hydrateLivePlannerDay,
      setRestoredSurvey,
      resetPlannerState,
    } = useAppStore.getState()

    if (authStatus !== 'signed-in' || !userId) {
      setUserDataStatus('idle')
      setProgress(null)
      setSessions([])
      resetPlannerState()
      return
    }

    let cancelled = false
    setUserDataStatus('loading')

    void loadUserData(userId)
      .then(async ({ progress, sessions, plannerDay }) => {
        if (cancelled) return
        // Reconcile a session left dangling by a window close. Runs only here (on
        // sign-in load, timer idle) — never on refreshUserData, which would treat an
        // in-flight session as an orphan.
        const { plannerDay: reconciledDay, restoredSurvey } = await reconcileActiveSession(
          userId,
          plannerDay,
          sessions,
        )
        if (cancelled) return
        setProgress(progress)
        setSessions(sessions)
        hydrateLivePlannerDay(reconciledDay)
        setRestoredSurvey(restoredSurvey)
        setUserDataStatus('ready')
      })
      .catch((err) => {
        console.warn('[user-data] Failed to load user data:', err)
        if (cancelled) return
        const fallback = defaultUserDataFallback()
        setProgress(fallback.progress)
        setSessions(fallback.sessions)
        hydrateLivePlannerDay(fallback.plannerDay)
        setRestoredSurvey(null)
        setUserDataStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [authStatus, userId])
}
