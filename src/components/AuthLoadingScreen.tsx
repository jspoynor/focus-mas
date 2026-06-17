export function AuthLoadingScreen() {
  return (
    <div className="app-shell flex min-h-svh items-center justify-center">
      <div className="text-center">
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm text-white/70">Loading…</p>
      </div>
    </div>
  )
}
