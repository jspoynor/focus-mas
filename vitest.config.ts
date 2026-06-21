import { defineConfig } from 'vitest/config'

/** Placeholder Firebase config so importing `firebase.ts` does not throw in CI/tests. */
const testFirebaseEnv = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
  VITE_FIREBASE_APP_ID: '1:123456789012:web:abcdef',
}

export default defineConfig({
  test: {
    environment: 'node',
    env: testFirebaseEnv,
  },
})
