import { useEffect, useState } from 'react'

const WIDE_LANDSCAPE_QUERY = '(min-width: 1024px) and (orientation: landscape)'

export function useWideLandscapeLayout() {
  const [isWideLandscape, setIsWideLandscape] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(WIDE_LANDSCAPE_QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(WIDE_LANDSCAPE_QUERY)
    const onChange = () => setIsWideLandscape(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return isWideLandscape
}

export function getPageScrollElement(): HTMLElement | null {
  return document.querySelector('.app-shell main')
}
