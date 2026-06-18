import { useEffect, useMemo, useState } from 'react'
import {
  MAX_STAGE_MINUTES,
  MIN_STAGE_MINUTES,
  STAGE_INCREMENT,
  WINDOW_MINUTES,
  computeRollingWindow,
  formatMasteryPercent,
} from '../lib/mastery'
import { refreshUserData } from '../lib/refreshUserData'
import { countUserSessions, resetUserAccount } from '../lib/resetAccount'
import { DEFAULT_PROGRESS, saveUserProgress } from '../lib/progress'
import { useAppStore } from '../store/useAppStore'
import type { UserProgress } from '../types'
import { DevConfirmModal } from './DevConfirmModal'

const STAGE_OPTIONS = Array.from(
  { length: (MAX_STAGE_MINUTES - MIN_STAGE_MINUTES) / STAGE_INCREMENT + 1 },
  (_, i) => MIN_STAGE_MINUTES + i * STAGE_INCREMENT,
)

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

function progressFormFromStore(progress: UserProgress) {
  return {
    currentStageMinutes: progress.currentStageMinutes,
    prevMasteryPercent:
      progress.prevMasteryPercent !== null
        ? String(Math.round(progress.prevMasteryPercent * 100))
        : '',
    lastProgressionAt: isoToDatetimeLocal(progress.lastProgressionAt),
    stepBackOfferedAt: isoToDatetimeLocal(progress.stepBackOfferedAt),
  }
}

function RollingWindowSummary() {
  const sessions = useAppStore((s) => s.sessions)

  const window = useMemo(() => computeRollingWindow(sessions), [sessions])

  return (
    <div className="rounded-glass border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-widest text-white/50">Rolling window</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">Accumulated focus time</dt>
          <dd className="font-mono text-white/90">
            {window.totalMinutes} / {WINDOW_MINUTES} min
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">Clean rate</dt>
          <dd className="font-mono text-white/90">
            {window.sessionCount > 0 ? formatMasteryPercent(window.cleanRate) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">Sessions in window</dt>
          <dd className="font-mono text-white/90">{window.sessionCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">Window full</dt>
          <dd className="font-mono text-white/90">{window.isFull ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </div>
  )
}

function ProgressEditor() {
  const userId = useAppStore((s) => s.userId)
  const progress = useAppStore((s) => s.progress)
  const [form, setForm] = useState(() =>
    progress ? progressFormFromStore(progress) : progressFormFromStore(DEFAULT_PROGRESS),
  )
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (progress) {
      setForm(progressFormFromStore(progress))
    }
  }, [progress])

  if (!userId || !progress) return null

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const prevMastery =
        form.prevMasteryPercent.trim() === ''
          ? null
          : Math.min(100, Math.max(0, Number(form.prevMasteryPercent))) / 100

      await saveUserProgress(userId, {
        currentStageMinutes: form.currentStageMinutes,
        prevMasteryPercent: prevMastery,
        lastProgressionAt: datetimeLocalToIso(form.lastProgressionAt),
        stepBackOfferedAt: datetimeLocalToIso(form.stepBackOfferedAt),
      })
      await refreshUserData(userId)
      setSaveMessage('Saved.')
    } catch (err) {
      console.error('[admin] Progress save failed:', err)
      setSaveMessage('Save failed — check console.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-glass border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-widest text-white/50">Progress editor</p>
      <div className="mt-3 space-y-3">
        <label className="block text-sm">
          <span className="text-white/60">Current stage (minutes)</span>
          <select
            value={form.currentStageMinutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, currentStageMinutes: Number(e.target.value) }))
            }
            className="mt-1 w-full rounded-glass border border-white/15 bg-black/30 px-2 py-1.5 text-white"
          >
            {STAGE_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-white/60">Previous mastery % (empty = null)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.prevMasteryPercent}
            onChange={(e) => setForm((f) => ({ ...f, prevMasteryPercent: e.target.value }))}
            placeholder="e.g. 85"
            className="mt-1 w-full rounded-glass border border-white/15 bg-black/30 px-2 py-1.5 text-white placeholder:text-white/30"
          />
        </label>

        <label className="block text-sm">
          <span className="text-white/60">Last progression at (empty = null)</span>
          <input
            type="datetime-local"
            value={form.lastProgressionAt}
            onChange={(e) => setForm((f) => ({ ...f, lastProgressionAt: e.target.value }))}
            className="mt-1 w-full rounded-glass border border-white/15 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>

        <label className="block text-sm">
          <span className="text-white/60">Step-back offered at (empty = null)</span>
          <input
            type="datetime-local"
            value={form.stepBackOfferedAt}
            onChange={(e) => setForm((f) => ({ ...f, stepBackOfferedAt: e.target.value }))}
            className="mt-1 w-full rounded-glass border border-white/15 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="glass-btn rounded-glass px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save progress'}
          </button>
          {saveMessage && <span className="text-xs text-white/60">{saveMessage}</span>}
        </div>
      </div>
    </div>
  )
}

function ResetAccountSection() {
  const userId = useAppStore((s) => s.userId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!userId) return null

  const openConfirm = async () => {
    setError(null)
    setConfirmOpen(true)
    setSessionCount(null)
    try {
      setSessionCount(await countUserSessions(userId))
    } catch (err) {
      console.error('[admin] Session count failed:', err)
      setError('Could not load session count.')
      setConfirmOpen(false)
    }
  }

  const handleReset = async () => {
    setBusy(true)
    setError(null)
    try {
      await resetUserAccount(userId)
      await refreshUserData(userId)
      setConfirmOpen(false)
    } catch (err) {
      console.error('[admin] Reset failed:', err)
      setError('Reset failed — check console.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="rounded-glass border border-red-500/20 bg-red-950/20 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-widest text-red-300/70">Danger zone</p>
        <p className="mt-2 text-sm text-white/70">
          Deletes all session documents and resets progress to defaults on your real Firestore
          account.
        </p>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        <button
          type="button"
          onClick={() => void openConfirm()}
          className="mt-3 rounded-glass bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Reset account
        </button>
      </div>

      <DevConfirmModal
        open={confirmOpen}
        title="Reset account?"
        confirmLabel="Reset account"
        destructive
        busy={busy || sessionCount === null}
        onCancel={() => !busy && setConfirmOpen(false)}
        onConfirm={() => void handleReset()}
      >
        <p>This will:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Delete{' '}
            <strong>{sessionCount === null ? '…' : sessionCount}</strong> session document
            {sessionCount === 1 ? '' : 's'}
          </li>
          <li>
            Reset progress: <code className="text-white/90">currentStageMinutes</code> → 25,
            null <code className="text-white/90">lastProgressionAt</code>,{' '}
            <code className="text-white/90">prevMasteryPercent</code>,{' '}
            <code className="text-white/90">stepBackOfferedAt</code>
          </li>
        </ul>
      </DevConfirmModal>
    </>
  )
}

export function AdminPage() {
  const userId = useAppStore((s) => s.userId)
  const authStatus = useAppStore((s) => s.authStatus)
  const userDataStatus = useAppStore((s) => s.userDataStatus)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl font-medium tracking-tight text-white">Dev tools</h1>

      <div className="rounded-glass border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-widest text-white/50">Signed-in UID</p>
        <p className="mt-2 font-mono text-sm text-white/90 break-all">
          {authStatus === 'signed-in' && userId ? userId : '—'}
        </p>
      </div>

      {userDataStatus === 'loading' ? (
        <p className="text-sm text-white/50">Loading user data…</p>
      ) : (
        <>
          <RollingWindowSummary />
          <ProgressEditor />
          <ResetAccountSection />
        </>
      )}

      <a
        href="/"
        className="inline-flex w-fit rounded-glass border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        ← Back to main app
      </a>
    </div>
  )
}
