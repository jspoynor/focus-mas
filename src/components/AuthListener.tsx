import { useEffect, type ReactNode } from 'react'
import { subscribeToAuthState } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

interface AuthListenerProps {
  children: ReactNode
}

export function AuthListener({ children }: AuthListenerProps) {
  const setAuth = useAppStore((s) => s.setAuth)

  useEffect(() => {
    return subscribeToAuthState(setAuth)
  }, [setAuth])

  return children
}
