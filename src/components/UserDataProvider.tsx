import type { ReactNode } from 'react'
import { useUserData } from '../hooks/useUserData'
import { SyncingIndicator } from './SyncingIndicator'

interface UserDataProviderProps {
  children: ReactNode
}

/** Loads Firestore user data after sign-in. */
export function UserDataProvider({ children }: UserDataProviderProps) {
  useUserData()

  return (
    <>
      {children}
      <SyncingIndicator />
    </>
  )
}
