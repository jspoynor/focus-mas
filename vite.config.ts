import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      // Lets Google sign-in popup close cleanly (avoids Firebase COOP console noise).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'wallpaper.jpg',
        'wallpaper-1.jpg',
        'wallpaper-2.jpg',
        'wallpaper-3.jpg',
      ],
      manifest: {
        name: 'Focus Más',
        short_name: 'Focus',
        description:
          'Train attention span through focus-based session progression.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,jpg,woff2}'],
        navigateFallback: '/index.html',
        // Never let the SPA fallback hijack Firebase Auth's reserved paths
        // (/__/auth/handler, /__/auth/iframe). Otherwise the service worker
        // serves index.html to the sign-in popup instead of Google's OAuth
        // handler — which reopens the app's own sign-in screen in the popup.
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
})
