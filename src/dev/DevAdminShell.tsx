import { AppLayout } from '../components/AppLayout'
import { AuthLoadingScreen } from '../components/AuthLoadingScreen'
import { SignInScreen } from '../components/SignInScreen'
import { useWallpaperCycle } from '../hooks/useWallpaperCycle'
import { useAppStore } from '../store/useAppStore'
import { AdminPage } from './AdminPage'

export function DevAdminShell() {
  const authStatus = useAppStore((s) => s.authStatus)
  const { cycle } = useWallpaperCycle()

  if (authStatus === 'unknown') {
    return <AuthLoadingScreen />
  }

  if (authStatus === 'signed-out') {
    return <SignInScreen />
  }

  return (
    <AppLayout onCycleWallpaper={cycle}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AdminPage />
      </div>
    </AppLayout>
  )
}
