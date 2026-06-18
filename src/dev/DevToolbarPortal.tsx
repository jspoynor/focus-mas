import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDevToolbar } from './DevToolbarContext'
import type { TimerDevHandles } from '../features/timer/Timer'

type TimerMode = ReturnType<NonNullable<TimerDevHandles['getMode']>>

function DevToolbarDock() {
  const {
    timer,
    session,
    shortDurationEnabled,
    setShortDurationEnabled,
    shortDurationSeconds,
    setShortDurationSeconds,
    toolbarOpen,
    setToolbarOpen,
  } = useDevToolbar()

  const [timerMode, setTimerMode] = useState<TimerMode>('idle')

  useEffect(() => {
    if (!timer) {
      setTimerMode('idle')
      return
    }

    setTimerMode(timer.getMode())
    return timer.subscribeToModeChange(() => {
      setTimerMode(timer.getMode())
    })
  }, [timer])

  const focusActive = timerMode === 'focus'
  const surveyOpen = session?.pendingSurvey !== null
  const surveySubmitting = session?.isSubmitting ?? false

  if (!toolbarOpen) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div
        id="dev-toolbar-panel"
        className="pointer-events-auto w-full max-w-sm min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-3 text-sm text-white shadow-lg"
        style={{
          maxHeight: 'calc(100dvh - 1.5rem - env(safe-area-inset-top, 0px))',
        }}
        role="region"
        aria-label="Dev toolbar"
      >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Dev tools
            </span>
            <button
              type="button"
              onClick={() => setToolbarOpen(false)}
              className="glass-btn-secondary rounded-glass px-2 py-0.5 text-xs text-white/70"
              aria-label="Close dev toolbar"
            >
              ×
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <section>
              <p className="mb-1.5 text-xs text-white/50">Timer</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={!focusActive}
                  onClick={() => timer?.completeNow()}
                  className="glass-btn rounded-glass px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Complete now
                </button>
              </div>
            </section>

            <section>
              <p className="mb-1.5 text-xs text-white/50">Short duration</p>
              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={shortDurationEnabled}
                  onChange={(e) => setShortDurationEnabled(e.target.checked)}
                  className="rounded"
                />
                Use short duration for next starts
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={shortDurationSeconds}
                  disabled={!shortDurationEnabled}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10)
                    if (!Number.isNaN(next) && next > 0) setShortDurationSeconds(next)
                  }}
                  className="w-16 rounded-glass glass-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                  aria-label="Short duration seconds"
                />
                <span className="text-xs text-white/50">sec</span>
              </div>
            </section>

            <section>
              <p className="mb-1.5 text-xs text-white/50">Survey</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={!surveyOpen || surveySubmitting}
                  onClick={() => session?.submitSurvey(true)}
                  className="glass-btn rounded-glass px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Uninterrupted
                </button>
                <button
                  type="button"
                  disabled={!surveyOpen || surveySubmitting}
                  onClick={() => session?.submitSurvey(false)}
                  className="glass-btn rounded-glass px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Interrupted
                </button>
              </div>
            </section>

            <p className="text-[10px] text-white/35">Press ` to toggle</p>

            <a
              href="/admin"
              className="inline-flex rounded-glass border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              Open /admin
            </a>
          </div>
        </div>
    </div>
  )
}

/** Renders the dev toolbar dock on document.body so it is never clipped by app overflow. */
export function DevToolbarPortal() {
  return createPortal(<DevToolbarDock />, document.body)
}
