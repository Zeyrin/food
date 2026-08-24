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
        // Workbox génère le service worker de A à Z : le seul endroit où
        // poser du code à nous est cet import. Il apporte le
        // `notificationclick` qui ramène dans l'app quand on touche
        // l'alerte d'un minuteur (voir public/sw-minuteurs.js).
        importScripts: ['/sw-minuteurs.js'],
        // Workbox répond `index.html` à toute navigation, ce qui est
        // exactement ce qu'il faut pour une SPA à une seule URL — et
        // exactement ce qu'il ne faut pas pour les pages prérendues
        // (`scripts/prerender.mjs`) : un visiteur qui a déjà l'app
        // installée recevait le catalogue au lieu de la recette qu'on
        // venait de lui envoyer. Ces adresses-là repassent par le
        // réseau. Elles n'existent pas hors ligne, et c'est cohérent :
        // ce sont des pages d'arrivée, l'app elle-même reste servie
        // depuis le cache à la racine.
        navigateFallbackDenylist: [/^\/recette\//],
      },
    }),
  ],
})
