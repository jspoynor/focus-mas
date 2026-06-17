/** True only in Vite dev server when VITE_DEV_TOOLS=true in .env.local */
export function isDevToolsEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_TOOLS === 'true'
}
