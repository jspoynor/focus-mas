import { describe, expect, it } from 'vitest'
import { classifyPopupError } from './auth'

describe('classifyPopupError', () => {
  it('falls back to redirect when the environment cannot support the popup', () => {
    expect(classifyPopupError('auth/popup-blocked')).toBe('fallback')
    expect(classifyPopupError('auth/web-storage-unsupported')).toBe('fallback')
    expect(classifyPopupError('auth/operation-not-supported-in-this-environment')).toBe(
      'fallback',
    )
  })

  it('falls back when the popup opened but never completed (mobile/Opera hang)', () => {
    // Firebase reports these once the stuck popup is closed; retry via redirect
    // rather than leaving the user on the sign-in screen.
    expect(classifyPopupError('auth/popup-closed-by-user')).toBe('fallback')
    expect(classifyPopupError('auth/cancelled-popup-request')).toBe('fallback')
  })

  it('treats genuine failures as errors to surface', () => {
    expect(classifyPopupError('auth/network-request-failed')).toBe('error')
    expect(classifyPopupError('auth/account-exists-with-different-credential')).toBe('error')
    expect(classifyPopupError('auth/internal-error')).toBe('error')
    expect(classifyPopupError('')).toBe('error')
  })
})
