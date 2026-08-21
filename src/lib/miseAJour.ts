/**
 * L'app est une PWA : son service worker sert les fichiers depuis le
 * cache, ce qui la rend utilisable en magasin sans réseau — mais fige
 * aussi la version installée. Sans rien pour piloter ça, un déploiement
 * ne se voyait qu'après avoir supprimé les données de l'app ou ouvert
 * une navigation privée. Tout ce qui suit sert à faire redescendre la
 * dernière version toute seule, et à laisser une porte de sortie quand
 * elle ne redescend pas.
 */

/** Estampille du build, injectée par Vite (voir `vite.config.ts`). */
export const VERSION_APP: string = __VERSION_APP__

/**
 * Dernier recours, affiché dans les réglages : on jette le service
 * worker et tous ses caches, puis on recharge — l'app se réinstalle
 * depuis le réseau à la version du jour.
 *
 * On ne touche ni au `localStorage` ni à IndexedDB : le foyer, le
 * panier, la liste et les minuteurs vivent là et n'ont aucune raison de
 * partir avec le cache des fichiers. C'est précisément ce que
 * « supprimer les données de l'app » détruisait au passage.
 */
export async function reinitialiserCache(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const enregistrements = await navigator.serviceWorker.getRegistrations()
      await Promise.all(enregistrements.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const cles = await caches.keys()
      await Promise.all(cles.map((cle) => caches.delete(cle)))
    }
  } finally {
    // `reload()` seul peut resservir la page depuis le cache HTTP du
    // navigateur ; repasser par l'URL avec un paramètre jetable force un
    // aller-retour réseau.
    const url = new URL(window.location.href)
    url.searchParams.set('maj', Date.now().toString(36))
    window.location.replace(url.toString())
  }
}
