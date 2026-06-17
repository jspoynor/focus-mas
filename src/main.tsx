import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { AuthListener } from './components/AuthListener'
import { UserDataProvider } from './components/UserDataProvider'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthListener>
      <UserDataProvider>
        <App />
      </UserDataProvider>
    </AuthListener>
  </StrictMode>,
)
