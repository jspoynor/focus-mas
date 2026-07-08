import { useEffect, type ReactNode } from 'react'
import { completePendingRedirect, subscribeToAuthState } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

interface AuthListenerProps {
  children: ReactNode
}

export function AuthListener({ children }: AuthListenerProps) {
  const setAuth = useAppStore((s) => s.setAuth)
  const setSignInError = useAppStore((s) => s.setSignInError)

  useEffect(() => {
    // Surface any failure from a signInWithRedirect that just returned; the
    // successful case resolves on its own through the auth-state subscription.
    void completePendingRedirect().then((error) => {
      if (error) setSignInError(error)
    })

    return subscribeToAuthState(setAuth)
  }, [setAuth, setSignInError])

  return children
}
