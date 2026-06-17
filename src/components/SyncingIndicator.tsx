import { useFirestoreSyncIndicator } from '../hooks/useFirestoreSync'

export function SyncingIndicator() {
  const isSyncing = useFirestoreSyncIndicator()

  if (!isSyncing) return null

  return (
    <p
      className="fixed bottom-4 right-4 z-20 rounded-glass glass-card px-3 py-2 text-xs text-white/70"
      role="status"
    >
      Syncing…
    </p>
  )
}
