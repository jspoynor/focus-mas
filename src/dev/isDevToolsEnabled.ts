/** True only in Vite dev server when VITE_DEV_TOOLS=true in .env.local */
export function isDevToolsEnabled(): boolean {
  if (!import.meta.env.DEV) return false
  const flag = String(import.meta.env.VITE_DEV_TOOLS ?? '').toLowerCase()
  return flag === 'true' || flag === '1'
}
