import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  enableNetwork,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function assertFirebaseEnv(): void {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ] as const

  const missing = required.filter((key) => !import.meta.env[key])

  if (missing.length === 0) return

  const message = `[firebase] Missing env vars: ${missing.join(', ')}. Auth and sync will not work until they are configured.`

  if (import.meta.env.PROD) {
    throw new Error(message)
  }

  console.warn(`${message} Copy .env.example to .env.local for local development.`)
}

assertFirebaseEnv()

function getOrCreateApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

/** Survives Vite HMR: reuse the existing Firestore instance when already initialized. */
function getOrCreateFirestore(firebaseApp: FirebaseApp): Firestore {
  const settings = import.meta.env.DEV
    ? { localCache: memoryLocalCache() }
    : {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      }

  try {
    return initializeFirestore(firebaseApp, settings)
  } catch {
    return getFirestore(firebaseApp)
  }
}

export const app: FirebaseApp = getOrCreateApp()
export const auth: Auth = getAuth(app)
export const db: Firestore = getOrCreateFirestore(app)

void enableNetwork(db).catch((err: unknown) => {
  console.warn('[firebase] Could not enable Firestore network:', err)
})
