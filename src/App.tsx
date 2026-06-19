import type { ReactNode } from 'react'
import { AppLayout } from './components/AppLayout'
import { CursorLight } from './components/CursorLight'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'
import { DataLoadingSkeleton } from './components/DataLoadingSkeleton'
import { LeftPanel } from './components/LeftPanel'
import { SignInScreen } from './components/SignInScreen'
import { DevAdminShell } from './dev/DevAdminShell'
import { DevToolbarBundle } from './dev/DevToolbarBundle'
import { DevToolsDisabledHint } from './dev/DevToolsDisabledHint'
import { isDevToolsEnabled } from './dev/isDevToolsEnabled'
import { ContributionCalendar } from './features/calendar/ContributionCalendar'
import { CenterColumn } from './features/session/CenterColumn'
import { usePathname } from './hooks/usePathname'
import { useWallpaperCycle } from './hooks/useWallpaperCycle'
import { useAppStore } from './store/useAppStore'

function MainShell({ onCycleWallpaper }: { onCycleWallpaper: () => void }) {
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  return (
    <AppLayout onCycleWallpaper={onCycleWallpaper}>
      {userDataStatus === 'loading' ? (
        <DataLoadingSkeleton />
      ) : (
        <div className="app-main-layout min-h-0 w-full flex-1 gap-4 overflow-x-hidden lg:gap-6">
          <div className="app-main-layout__left flex min-h-0 flex-col">
            <LeftPanel />
          </div>
          <div className="app-main-layout__center flex min-h-0 min-w-0 flex-col justify-center overflow-y-auto overflow-x-hidden lg:shrink">
            <CenterColumn />
          </div>
          <div className="app-main-layout__right flex min-h-0 flex-col">
            <ContributionCalendar />
          </div>
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

function DevToolsWrapper({ children }: { children: ReactNode }) {
  if (!import.meta.env.DEV) {
    return children
  }

  if (!isDevToolsEnabled()) {
    return (
      <>
        {children}
        <DevToolsDisabledHint />
      </>
    )
  }

  return <DevToolbarBundle>{children}</DevToolbarBundle>
}

function App() {
  const pathname = usePathname()
  const devTools = isDevToolsEnabled()

  const content =
    devTools && import.meta.env.DEV && pathname === '/admin' ? (
      <DevAdminShell />
    ) : (
      <MainApp />
    )

  return <DevToolsWrapper>{content}</DevToolsWrapper>
}

export default App
