import { createPortal } from 'react-dom'

interface DevConfirmModalProps {
  open: boolean
  title: string
  children: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  destructive?: boolean
}

export function DevConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
  destructive = false,
}: DevConfirmModalProps) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-confirm-title"
        className="w-full max-w-md rounded-glass border border-white/15 bg-slate-900/95 p-5 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dev-confirm-title" className="text-lg font-medium tracking-tight">
          {title}
        </h2>
        <div className="mt-3 text-sm text-white/75">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="glass-btn-secondary rounded-glass px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-glass px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              destructive
                ? 'bg-red-600/80 text-white hover:bg-red-600'
                : 'glass-btn text-white'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
