import { GoogleSignInButton } from '../../components/GoogleSignInButton'
import { MAX_STAGE_MINUTES, MIN_STAGE_MINUTES } from '../../lib/mastery'

export function CloseSection() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-28 pt-12 text-center">
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">
        Start at {MIN_STAGE_MINUTES} minutes.
      </h2>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
        Focus Más trains your attention one session at a time. The climb to{' '}
        {MAX_STAGE_MINUTES} minutes takes as long as it takes.
      </p>

      <GoogleSignInButton className="mt-10 w-full max-w-xs" />
    </section>
  )
}
