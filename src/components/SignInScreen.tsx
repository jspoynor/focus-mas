import { GoogleSignInButton } from './GoogleSignInButton'

/**
 * Plain sign-in gate for the dev admin route. Signed-out visitors to the app itself get
 * the marketing page (`src/marketing/`), not this.
 */
export function SignInScreen() {
  return (
    <div className="app-shell flex min-h-svh items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-glass-lg p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-white/50">Focus Más</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Focus Más</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/75">
          Sign in to continue.
        </p>

        <GoogleSignInButton className="mt-8" />
      </div>
    </div>
  )
}
