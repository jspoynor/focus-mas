import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import type { AuthStatus } from '../store/useAppStore'

export interface AuthStatePayload {
  status: AuthStatus
  userId: string | null
  displayName: string | null
}

function mapUserToAuthState(user: User | null): AuthStatePayload {
  if (!user) {
    return { status: 'signed-out', userId: null, displayName: null }
  }

  return {
    status: 'signed-in',
    userId: user.uid,
    displayName: user.displayName ?? user.email ?? 'User',
  }
}

export function subscribeToAuthState(
  onChange: (payload: AuthStatePayload) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    onChange(mapUserToAuthState(user))
  })
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider())
    return { error: null }
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : ''

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { error: null }
    }

    if (code === 'auth/popup-blocked') {
      return { error: 'Sign-in popup was blocked. Allow popups for this site and try again.' }
    }

    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign-in failed. Please try again.'

    return { error: message }
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}
