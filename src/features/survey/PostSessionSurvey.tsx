import { useState, type FormEvent } from 'react'

export interface PendingSurveySession {
  sessionId: string
  durationMinutes: number
  startedAt: string
}

interface PostSessionSurveyProps {
  session: PendingSurveySession
  isExiting: boolean
  onSubmit: (answers: { q1Distracted: boolean; q2UsedPhone: boolean }) => void
  isSubmitting: boolean
}

function YesNoButtons({
  question,
  hint,
  value,
  onChange,
  name,
}: {
  question: string
  hint: string
  value: boolean | null
  onChange: (answer: boolean) => void
  name: string
}) {
  return (
    <fieldset className="text-left">
      <legend className="text-sm font-medium leading-snug text-white">{question}</legend>
      <p className="mt-1 text-xs leading-relaxed text-white/50">{hint}</p>
      <div className="mt-3 flex gap-2">
        {(
          [
            { answer: false, text: 'No' },
            { answer: true, text: 'Yes' },
          ] as const
        ).map(({ answer, text }) => {
          const id = `${name}-${text.toLowerCase()}`
          const selected = value === answer

          return (
            <button
              key={id}
              id={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(answer)}
              className="glass-btn flex-1 rounded-glass px-4 py-2.5 text-sm font-medium text-white/90"
            >
              {text}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function PostSessionSurvey({
  session,
  isExiting,
  onSubmit,
  isSubmitting,
}: PostSessionSurveyProps) {
  const [q1Distracted, setQ1Distracted] = useState<boolean | null>(null)
  const [q2UsedPhone, setQ2UsedPhone] = useState<boolean | null>(null)

  const canSubmit = q1Distracted !== null && q2UsedPhone !== null && !isSubmitting

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || q1Distracted === null || q2UsedPhone === null) return

    onSubmit({ q1Distracted, q2UsedPhone })
  }

  return (
    <section
      className={`glass-card rounded-glass-lg p-6 transition-all duration-500 ease-out ${
        isExiting
          ? 'translate-y-4 opacity-0'
          : 'animate-survey-enter translate-y-0 opacity-100'
      }`}
      aria-label="Post-session survey"
    >
      <h2 className="text-lg font-medium text-white">Quick check-in</h2>
      <p className="mt-1 text-sm text-white/60">
        {session.durationMinutes} min session · yes = counts against your focus rate
      </p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <YesNoButtons
          name="q1"
          question="1. Did you get distracted?"
          hint="Mind wandered, switched tasks, or got pulled away from your plan."
          value={q1Distracted}
          onChange={setQ1Distracted}
        />
        <YesNoButtons
          name="q2"
          question="2. Did you use your phone or social media?"
          hint="Any check during the session counts — even a quick glance."
          value={q2UsedPhone}
          onChange={setQ2UsedPhone}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="glass-btn w-full rounded-glass px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Saving…' : 'Continue to break'}
        </button>
      </form>
    </section>
  )
}
