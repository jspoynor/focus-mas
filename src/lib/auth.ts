import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
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

/**
 * What to do when signInWithPopup rejects:
 * - 'fallback': the environment can't support the popup flow (mobile browsers,
 *   privacy-hardened browsers like Opera that block the cross-origin storage the
 *   popup handler needs). Retry via a full-page redirect, which uses first-party
 *   storage and works where popups don't.
 * - 'user-cancel': the user themselves dismissed the popup — no action, no error.
 * - 'error': a genuine failure worth showing to the user.
 */
export type PopupErrorAction = 'fallback' | 'user-cancel' | 'error'

const FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/web-storage-unsupported',
  'auth/operation-not-supported-in-this-environment',
])

const USER_CANCEL_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
])

export function classifyPopupError(code: string): PopupErrorAction {
  if (FALLBACK_CODES.has(code)) return 'fallback'
  if (USER_CANCEL_CODES.has(code)) return 'user-cancel'
  return 'error'
}

function errorCode(err: unknown): string {
  return err && typeof err === 'object' && 'code' in err
    ? String((err as { code: string }).code)
    : ''
}

function errorMessage(err: unknown): string {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: string }).message)
    : 'Sign-in failed. Please try again.'
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
    switch (classifyPopupError(errorCode(err))) {
      case 'user-cancel':
        return { error: null }
      case 'fallback':
        // Navigates away; sign-in completes on reload via onAuthStateChanged,
        // and any failure surfaces through completePendingRedirect().
        await signInWithRedirect(auth, new GoogleAuthProvider())
        return { error: null }
      case 'error':
        return { error: errorMessage(err) }
    }
  }
}

/**
 * Resolves a pending signInWithRedirect after the browser returns from Google.
 * The happy path completes on its own via onAuthStateChanged; this call exists to
 * surface a *failed* redirect, whose error would otherwise be lost to the reload.
 * Returns an error message to display, or null when there's nothing to report.
 */
export async function completePendingRedirect(): Promise<string | null> {
  try {
    await getRedirectResult(auth)
    return null
  } catch (err) {
    return errorMessage(err)
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}
