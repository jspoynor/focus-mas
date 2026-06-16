import type { ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const authStatus = useAppStore((s) => s.authStatus)
  const displayName = useAppStore((s) => s.displayName)

  return (
    <div className="min-h-svh">
      <header className="glass-nav sticky top-0 z-10 flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">
            Focus Mastery
          </p>
          <h1 className="text-xl font-semibold text-white">Train your attention</h1>
        </div>
        <div className="text-right text-sm text-white/70">
          {authStatus === 'signed-in' && displayName ? (
            <span>{displayName}</span>
          ) : (
            <span>
              {/* TODO(grill-me): Google sign-in via Firebase Auth */}
              Sign in (stub)
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
