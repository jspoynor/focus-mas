import { createPortal } from 'react-dom'

/** Shown in dev when VITE_DEV_TOOLS is not enabled — explains why toolbar and /admin are missing. */
export function DevToolsDisabledHint() {
  if (!import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true') {
    return null
  }

  return createPortal(
    <div
      className="fixed z-50 max-w-sm rounded-glass border border-amber-400/30 bg-amber-950/80 px-3 py-2 text-xs text-amber-100 shadow-lg backdrop-blur-md"
      style={{
        left: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        maxWidth: 'calc(100vw - 1.5rem)',
      }}
      role="status"
    >
      <p className="font-medium">Dev tools are off</p>
      <p className="mt-1 text-amber-100/80">
        Add <code className="text-amber-50">VITE_DEV_TOOLS=true</code> to{' '}
        <code className="text-amber-50">.env.local</code>, save the file, then restart{' '}
        <code className="text-amber-50">npm run dev</code>.
      </p>
    </div>,
    document.body,
  )
}
