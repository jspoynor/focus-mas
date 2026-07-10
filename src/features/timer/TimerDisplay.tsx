import { formatCountdown } from '../../lib/formatCountdown'

export interface TimerAction {
  label: string
  onClick: () => void
  disabled?: boolean
  /** Stop/skip actions render slightly dimmer than the primary "Start focus". */
  muted?: boolean
}

interface TimerDisplayProps {
  compact?: boolean
  /** Small caps line above the countdown: "Ready", "Focus session", "Break". */
  modeLabel: string
  displaySeconds: number
  /** Line under the countdown: "25 min focus · 5 min break". */
  subLabel: string
  /** Omit to render no button (completed state). */
  action?: TimerAction | null
  showDiscardWarning?: boolean
}

/**
 * Presentation only — no state, no persistence. `Timer` wraps this with session
 * state and Firestore writes; the marketing demo drives it with a fake clock.
 */
export function TimerDisplay({
  compact = false,
  modeLabel,
  displaySeconds,
  subLabel,
  action = null,
  showDiscardWarning = false,
}: TimerDisplayProps) {
  return (
    <section
      className={`w-full min-w-0 text-center transition-all duration-500 ease-out ${compact ? 'py-2' : 'py-4'}`}
      aria-label="Focus timer"
    >
      <p className="text-xs uppercase tracking-widest text-white/50">{modeLabel}</p>
      <p
        className={`timer-display mt-4 w-full max-w-full overflow-hidden font-bold tabular-nums tracking-tight text-white transition-all duration-500 ease-out ${
          compact ? 'timer-display--compact' : ''
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {formatCountdown(displaySeconds)}
      </p>
      <p className="mt-3 text-sm text-white/60">{subLabel}</p>

      {action ? (
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`glass-btn-oval text-sm font-medium ${action.muted ? 'text-white/90' : 'text-white'}`}
          >
            {action.label}
          </button>
        </div>
      ) : null}

      <p
        className={`mt-4 min-h-[1rem] text-xs text-white/45 ${
          showDiscardWarning ? 'visible' : 'invisible'
        }`}
        aria-hidden={!showDiscardWarning}
      >
        Stopping early discards this session.
      </p>
    </section>
  )
}
