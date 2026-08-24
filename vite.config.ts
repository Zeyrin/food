import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Ce qu'on affiche dans les réglages pour savoir quelle version tourne
 * sur le téléphone : la date du build, plus le début du commit quand
 * Vercel le fournit. Sans ça, « c'est à jour ? » ne se vérifie qu'en
 * cherchant un changement visible à l'œil.
 */
const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
const dateBuild = new Date().toISOString().slice(0, 16).replace('T', ' ')
const versionApp = commit ? `${dateBuild} · ${commit}` : dateBuild

export default defineConfig({
  define: {
    __VERSION_APP__: JSON.stringify(versionApp),
  },
  plugins: [
    react(),
    VitePWA({
      // « prompt » plutôt qu'« autoUpdate » : l'app garde la main sur le
      // moment où la nouvelle version s'installe (voir
      // hooks/useMiseAJour.ts). Elle bascule toute seule au démarrage ou
      // quand l'app est en arrière-plan, et propose un bandeau plutôt que
      // de recharger l'écran sous les doigts en pleine cuisson.
      registerType: 'prompt',
      // L'enregistrement se fait depuis le code de l'app, pas par un
      // script injecté : c'est lui qui vérifie régulièrement s'il y a du neuf.
      injectRegister: null,
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
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,ttf}'],
        // Les caches des versions précédentes ne servent plus à rien une
        // fois la nouvelle installée — et occupaient le quota jusqu'à
        // faire échouer la mise en cache suivante sur un téléphone plein.
        cleanupOutdatedCaches: true,
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
