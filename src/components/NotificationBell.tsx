import { useId, useRef, useState } from 'react'
import { useSessionNotificationPreference } from '../hooks/useSessionNotificationPreference'
import { FloatingTooltip } from './FloatingTooltip'

function BellIconOutline() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function BellIconFilled() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 2a6 6 0 0 0-6 6c0 5.25-2.25 7.5-2.25 7.5h16.5S18 13.25 18 8a6 6 0 0 0-6-6Z" />
      <path d="M10.2 20.4a2.4 2.4 0 0 0 3.6 0" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function BellIconBlocked() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <BellIconOutline />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <span className="h-px w-[1.125rem] rotate-[-45deg] bg-current opacity-80" />
      </span>
    </span>
  )
}

const TOOLTIP_BY_STATE = {
  off: 'Enable session alerts',
  on: 'Desktop notifications on',
  blocked: 'Notifications blocked — check browser settings',
} as const

export function NotificationBell() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipId = useId()
  const { bellState, toggle } = useSessionNotificationPreference()

  const label =
    bellState === 'on'
      ? 'Turn off desktop notifications'
      : bellState === 'blocked'
        ? 'Retry notification permission'
        : 'Turn on desktop notifications'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void toggle()}
        className={`shrink-0 appearance-none border-0 !bg-transparent p-0 outline-none transition-colors active:!bg-transparent aria-pressed:!bg-transparent focus-visible:outline-none ${
          bellState === 'on'
            ? 'text-white/80 hover:text-white'
            : bellState === 'blocked'
              ? 'text-white/35 hover:text-white/55'
              : 'text-white/45 hover:text-white/70'
        }`}
        aria-label={label}
        aria-pressed={bellState === 'on'}
        aria-describedby={tooltipOpen ? tooltipId : undefined}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        onFocus={() => setTooltipOpen(true)}
        onBlur={() => setTooltipOpen(false)}
      >
        {bellState === 'on' ? (
          <BellIconFilled />
        ) : bellState === 'blocked' ? (
          <BellIconBlocked />
        ) : (
          <BellIconOutline />
        )}
      </button>
      <FloatingTooltip
        anchorRef={buttonRef}
        open={tooltipOpen}
        id={tooltipId}
        textAlign="left"
        maxWidthClass="max-w-56"
      >
        {TOOLTIP_BY_STATE[bellState]}
      </FloatingTooltip>
    </>
  )
}
