import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FFFood',
        short_name: 'FFFood',
        description: 'FFFood : recettes, panier de la semaine et liste de courses, sans compte.',
        theme_color: '#385e16',
        background_color: '#fff8ef',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Les photos des plats sont précachées avec le reste : sans elles,
        // l'app hors ligne retombait sur la vignette teintée alors que le
        // catalogue, lui, est embarqué au build.
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,ttf}'],
      },
    }),
  ],
})
