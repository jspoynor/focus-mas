import { useId, useRef, useState, type ReactNode } from 'react'
import { FloatingTooltip } from './FloatingTooltip'
import { dateFromDateKey } from '../lib/calendarGrid'
import { signOut } from '../lib/auth'
import { formatLongDateWithOrdinal } from '../lib/formatDate'
import { usePlannerSnapshot } from '../hooks/usePlannerSnapshot'
import { useAppStore } from '../store/useAppStore'

interface AppLayoutProps {
  children: ReactNode
  onCycleWallpaper?: () => void
}

export function AppLayout({ children, onCycleWallpaper }: AppLayoutProps) {
  const wallpaperButtonRef = useRef<HTMLButtonElement>(null)
  const [wallpaperTooltipOpen, setWallpaperTooltipOpen] = useState(false)
  const wallpaperTooltipId = useId()
  const displayName = useAppStore((s) => s.displayName)
  const snapshotDateKey = useAppStore((s) => s.snapshotDateKey)
  const { returnToToday } = usePlannerSnapshot()

  const today = new Date()
  const isSnapshot = snapshotDateKey !== null
  const headerDate = isSnapshot ? dateFromDateKey(snapshotDateKey) : today
  const headerLabel = isSnapshot
    ? `Snapshot · ${formatLongDateWithOrdinal(headerDate)}`
    : formatLongDateWithOrdinal(today)

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="app-shell flex h-svh flex-col overflow-hidden">
      <header className="app-header z-10 shrink-0 bg-transparent px-4 py-3 sm:px-6">
        <p className="app-header__brand min-w-0 truncate text-xs uppercase tracking-widest text-white/50">
          Focus Más
        </p>
        <div className="app-header__center flex min-w-0 max-w-full items-center justify-center gap-2 sm:gap-3">
          <time
            dateTime={isSnapshot ? snapshotDateKey : today.toISOString().slice(0, 10)}
            className="min-w-0 truncate text-sm text-white/60"
            title={headerLabel}
          >
            {headerLabel}
          </time>
          {isSnapshot ? (
            <button
              type="button"
              onClick={() => void returnToToday()}
              className="shrink-0 rounded-glass px-2.5 py-1 text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white/80"
            >
              Return to today
            </button>
          ) : null}
        </div>
        <div className="app-header__actions flex min-w-0 items-center justify-end gap-2 sm:gap-4">
          {displayName ? (
            <span className="hidden max-w-[7rem] truncate text-xs tracking-widest text-white/50 min-[480px]:inline">
              {displayName}
            </span>
          ) : null}
          {onCycleWallpaper ? (
            <>
              <button
                ref={wallpaperButtonRef}
                type="button"
                onClick={onCycleWallpaper}
                className="rounded-glass px-3 py-1.5 text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
                aria-label="Cycle wallpaper"
                aria-describedby={wallpaperTooltipOpen ? wallpaperTooltipId : undefined}
                onMouseEnter={() => setWallpaperTooltipOpen(true)}
                onMouseLeave={() => setWallpaperTooltipOpen(false)}
                onFocus={() => setWallpaperTooltipOpen(true)}
                onBlur={() => setWallpaperTooltipOpen(false)}
              >
                Cycle
              </button>
              <FloatingTooltip
                anchorRef={wallpaperButtonRef}
                open={wallpaperTooltipOpen}
                id={wallpaperTooltipId}
              >
                Cycle wallpaper
              </FloatingTooltip>
            </>
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
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pt-0 pb-4 sm:px-6 lg:px-8 lg:py-0">
        {children}
      </main>
    </div>
  )
}
