import type { CapacitorConfig } from '@capacitor/cli'

/**
 * L'app des stores est la PWA elle-même, servie depuis le paquet
 * installé plutôt que depuis www.fffood.fr : même bundle, mêmes
 * recettes embarquées, donc toujours utilisable hors ligne en magasin.
 * Ce qui change sur téléphone natif est regroupé dans `src/lib/natif.ts`.
 */
const config: CapacitorConfig = {
  appId: 'fr.fffood.app',
  appName: 'FFFood',
  webDir: 'dist',
  backgroundColor: '#fff8ef',
  android: {
    // Le fond de la WebView avant le premier rendu : celui de l'app, pas un blanc pur.
    backgroundColor: '#fff8ef',
  },
  ios: {
    backgroundColor: '#fff8ef',
    contentInset: 'never',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#ff5a36',
    },
  },
}

export default config
