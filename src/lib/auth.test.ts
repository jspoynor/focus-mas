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

  it('treats a user dismissing the popup as a silent cancel, not a retry', () => {
    expect(classifyPopupError('auth/popup-closed-by-user')).toBe('user-cancel')
    expect(classifyPopupError('auth/cancelled-popup-request')).toBe('user-cancel')
  })

  it('treats genuine failures as errors to surface', () => {
    expect(classifyPopupError('auth/network-request-failed')).toBe('error')
    expect(classifyPopupError('auth/account-exists-with-different-credential')).toBe('error')
    expect(classifyPopupError('auth/internal-error')).toBe('error')
    expect(classifyPopupError('')).toBe('error')
  })
})
