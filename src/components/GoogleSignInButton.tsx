import { useState } from 'react'
import { signInWithGoogle } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

interface GoogleSignInButtonProps {
  className?: string
  label?: string
  /** Full-width block button (the page CTA) vs. a compact inline button (the header). */
  fullWidth?: boolean
  /** The header button hides errors; the primary CTA at the bottom surfaces them. */
  showError?: boolean
}

/**
 * The only side effect permitted on the marketing page. Surfaces both a live
 * sign-in failure and one left in the store by a redirect that failed on a
 * prior page load.
 */
export function GoogleSignInButton({
  className = '',
  label = 'Sign in with Google',
  fullWidth = true,
  showError = true,
}: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const redirectError = useAppStore((s) => s.signInError)
  const setSignInError = useAppStore((s) => s.setSignInError)

  const displayedError = error ?? redirectError

  async function handleSignIn() {
    setError(null)
    setSignInError(null)
    setIsSigningIn(true)

    const result = await signInWithGoogle()

    if (result.error) {
      setError(result.error)
    }

    setIsSigningIn(false)
  }

  return (
    <div className={className}>
      {showError && displayedError ? (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {displayedError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className={`glass-btn rounded-glass text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
          fullWidth ? 'w-full px-4 py-3' : 'px-4 py-2'
        }`}
      >
        {isSigningIn ? 'Signing in…' : label}
      </button>
    </div>
  )
}
