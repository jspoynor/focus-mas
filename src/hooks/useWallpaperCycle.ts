import { useCallback, useEffect, useMemo, useState } from 'react'
import { WALLPAPERS } from '../lib/wallpapers'

const STORAGE_KEY = 'focus-mastery-wallpaper-index'

function clampIndex(value: number): number {
  const max = Number(WALLPAPERS.length)
  if (max === 0) return 0
  const normalized = Math.floor(value) % max
  return normalized < 0 ? normalized + max : normalized
}

function readStoredIndex(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? clampIndex(parsed) : 0
}

export function useWallpaperCycle() {
  const [index, setIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return readStoredIndex()
  })

  const wallpaper = useMemo(() => WALLPAPERS[clampIndex(index)], [index])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--app-wallpaper', wallpaper.cssUrl)
    localStorage.setItem(STORAGE_KEY, String(clampIndex(index)))
  }, [index, wallpaper.cssUrl])

  const cycle = useCallback(() => {
    setIndex((prev) => clampIndex(prev + 1))
  }, [])

  return { index: clampIndex(index), wallpaper, cycle, total: WALLPAPERS.length }
}

