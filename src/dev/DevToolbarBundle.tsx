import type { ReactNode } from 'react'
import { DevToolbarPortal } from './DevToolbarPortal'
import { DevToolbarProvider } from './DevToolbarContext'

export function DevToolbarBundle({ children }: { children: ReactNode }) {
  return (
    <DevToolbarProvider>
      {children}
      <DevToolbarPortal />
    </DevToolbarProvider>
  )
}
