import { loadUserData } from './loadUserData'
import { useAppStore } from '../store/useAppStore'

/** Re-fetches progress + sessions from Firestore and updates the Zustand store. */
export async function refreshUserData(userId: string): Promise<void> {
  const { setProgress, setSessions, setPendingStepBackTargetMinutes } = useAppStore.getState()

  const { progress, sessions } = await loadUserData(userId)
  setProgress(progress)
  setSessions(sessions)
  setPendingStepBackTargetMinutes(null)
}
