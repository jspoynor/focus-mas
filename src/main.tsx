import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthListener } from './components/AuthListener'
import { UserDataProvider } from './components/UserDataProvider'

/** Service workers intercept network requests and break Firestore in local dev. */
async function prepareClient(): Promise<void> {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

void prepareClient().then(() => {
  if (import.meta.env.PROD) {
    void import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthListener>
        <UserDataProvider>
          <App />
        </UserDataProvider>
      </AuthListener>
    </StrictMode>,
  )
})
