import type { ReactNode } from 'react'
import { signOut } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

interface AppLayoutProps {
  children: ReactNode
  onCycleWallpaper?: () => void
}

export function AppLayout({ children, onCycleWallpaper }: AppLayoutProps) {
  const displayName = useAppStore((s) => s.displayName)

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="app-shell flex h-svh flex-col overflow-hidden">
      <header className="z-10 flex shrink-0 items-center justify-between bg-transparent px-6 py-3">
        <p className="text-xs uppercase tracking-widest text-white/50">Focus Mastery</p>
        <div className="flex items-center gap-4">
          {displayName ? (
            <span className="text-xs tracking-widest text-white/50">{displayName}</span>
          ) : null}
          {onCycleWallpaper ? (
            <button
              type="button"
              onClick={onCycleWallpaper}
              className="rounded-glass px-3 py-1.5 text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
              aria-label="Cycle wallpaper"
              title="Cycle wallpaper"
            >
              Cycle
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs uppercase tracking-widest text-white/50 transition-opacity hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex min-h-0 w-full flex-1 flex-col justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-0">
        {children}
      </main>
    </div>
  )
}
