/**
 * TODO(grill-me): Post-session survey after each focus block.
 * Two yes/no questions:
 * 1. Did you get distracted?
 * 2. Did you use your phone or social media during the focus session?
 * Answers feed mastery progression and calendar opacity.
 */
export function PostSessionSurvey() {
  return (
    <section
      className="glass-card rounded-glass-lg p-6"
      aria-label="Post-session survey"
    >
      <h2 className="text-lg font-medium text-white">Post-session survey</h2>
      <p className="mt-2 text-sm text-white/70">
        Stub — survey flow pending grill-me spec.
      </p>
      <ul className="mt-4 list-inside list-disc text-left text-sm text-white/80">
        <li>Did you get distracted?</li>
        <li>Did you use your phone or social media during the focus session?</li>
      </ul>
    </section>
  )
}
