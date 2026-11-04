
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: [
        'favicon.svg',
        'pwa-192.svg',
        'pwa-512.svg'
      ],

      manifest: {
        name: 'StudyMate - Manajemen Tugas Mahasiswa',
        short_name: 'StudyMate',
        description: 'Aplikasi PWA untuk mengelola tugas kuliah.',
        theme_color: '#4f46e5',
        background_color: '#f6f7fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,ico,png,jpg,jpeg,webp,woff,woff2}'
        ],

        navigateFallback: '/index.html',

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
