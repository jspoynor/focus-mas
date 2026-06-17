import { lazy, Suspense } from 'react'
import { AppLayout } from './components/AppLayout'
import { CursorLight } from './components/CursorLight'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'
import { DataLoadingSkeleton } from './components/DataLoadingSkeleton'
import { LeftPanel } from './components/LeftPanel'
import { SignInScreen } from './components/SignInScreen'
import { ContributionCalendar } from './features/calendar/ContributionCalendar'
import { CenterColumn } from './features/session/CenterColumn'
import { usePathname } from './hooks/usePathname'
import { useWallpaperCycle } from './hooks/useWallpaperCycle'
import { isDevToolsEnabled } from './dev/isDevToolsEnabled'
import { useAppStore } from './store/useAppStore'

const DevAdminShell = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/DevAdminShell').then((m) => ({ default: m.DevAdminShell })),
    )
  : null

function MainShell({ onCycleWallpaper }: { onCycleWallpaper: () => void }) {
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  return (
    <AppLayout onCycleWallpaper={onCycleWallpaper}>
      {userDataStatus === 'loading' ? (
        <DataLoadingSkeleton />
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden lg:grid lg:grid-cols-[minmax(0,0.48fr)_minmax(0,2.24fr)_minmax(0,0.48fr)] lg:items-center lg:gap-6 lg:overflow-hidden">
          <LeftPanel />
          <div className="flex min-h-0 min-w-0 shrink-0 flex-col justify-center overflow-y-auto overflow-x-hidden lg:min-h-0 lg:shrink">
            <CenterColumn />
          </div>
          <ContributionCalendar />
        </div>
      )}
    </AppLayout>
  )
}

function MainApp() {
  const authStatus = useAppStore((s) => s.authStatus)
  const { cycle } = useWallpaperCycle()

  return (
    <>
      <CursorLight />
      {authStatus === 'unknown' ? (
        <AuthLoadingScreen />
      ) : authStatus === 'signed-out' ? (
        <SignInScreen />
      ) : (
        <MainShell onCycleWallpaper={cycle} />
      )}
    </>
  )
}

function App() {
  const pathname = usePathname()

  if (isDevToolsEnabled() && pathname === '/admin' && DevAdminShell) {
    return (
      <Suspense fallback={<AuthLoadingScreen />}>
        <DevAdminShell />
      </Suspense>
    )
  }

  return <MainApp />
}

export default App
