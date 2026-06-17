import { useAppStore } from '../store/useAppStore'

export function AdminPage() {
  const userId = useAppStore((s) => s.userId)
  const authStatus = useAppStore((s) => s.authStatus)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl font-medium tracking-tight text-white">Dev tools</h1>

      <div className="rounded-glass border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-widest text-white/50">Signed-in UID</p>
        <p className="mt-2 font-mono text-sm text-white/90 break-all">
          {authStatus === 'signed-in' && userId ? userId : '—'}
        </p>
      </div>

      <a
        href="/"
        className="inline-flex w-fit rounded-glass border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        ← Back to main app
      </a>
    </div>
  )
}
