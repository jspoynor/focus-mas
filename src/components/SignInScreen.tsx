import { useState } from 'react'
import { signInWithGoogle } from '../lib/auth'

export function SignInScreen() {
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function handleSignIn() {
    setError(null)
    setIsSigningIn(true)

    const result = await signInWithGoogle()

    if (result.error) {
      setError(result.error)
    }

    setIsSigningIn(false)
  }

  return (
    <div className="app-shell flex min-h-svh items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-glass-lg p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-white/50">Focus Mastery</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Focus Mastery</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/75">
          Focus Mastery trains your attention span one session at a time. Complete
          distraction-free sessions to prove you&apos;ve mastered your current focus
          length — then grow into longer ones.
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="glass-btn mt-8 w-full rounded-glass px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  )
}
