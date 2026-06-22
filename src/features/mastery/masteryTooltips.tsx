import {
  MAX_STAGE_MINUTES,
  MIN_STAGE_MINUTES,
  nextStageMinutes,
  STREAK_TARGET,
} from '../../lib/mastery'
import { getStageLadder } from '../../lib/beltColors'

const STAGE_LADDER = getStageLadder()

export function FocusLevelTooltipContent() {
  return (
    <div>
      <p className="text-white/90">
        Focus sessions start at {MIN_STAGE_MINUTES} min. Each level adds 5 min, up to{' '}
        {MAX_STAGE_MINUTES} min.
      </p>
      <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
        {STAGE_LADDER.map(({ minutes, color }) => (
          <li key={minutes} className="flex items-center gap-2 text-white/75">
            <span
              className="size-2.5 shrink-0 rounded-sm border border-white/20"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span>{minutes} min</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StreakTooltipContent({
  streak,
  stageMinutes,
  atMax,
}: {
  streak: number
  stageMinutes: number
  atMax: boolean
}) {
  const statusLine = getStreakStatusLine(streak, stageMinutes, atMax)

  return (
    <div className="space-y-2">
      <p className="text-white/90">
        Complete {STREAK_TARGET} uninterrupted sessions in a row to level up.
      </p>
      <p className="text-white/75">
        Uninterrupted means you answered no to both check-in questions (no distraction, no
        phone or social).
      </p>
      <p className="text-white/75">
        One distracted session resets your streak to 0. Your focus duration never goes down.
      </p>
      <p className="font-medium text-white">{statusLine}</p>
    </div>
  )
}

function getStreakStatusLine(streak: number, stageMinutes: number, atMax: boolean): string {
  if (atMax) {
    return "You've reached the maximum focus level."
  }

  const nextMinutes = nextStageMinutes(stageMinutes)
  const remaining = STREAK_TARGET - streak
  const sessionLabel = remaining === 1 ? 'session' : 'sessions'

  return `${remaining} more uninterrupted ${sessionLabel} to reach ${nextMinutes} min.`
}
