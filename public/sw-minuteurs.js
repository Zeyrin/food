/*
 * Ce qui manquait au minuteur : le retour dans l'app.
 *
 * La notification sortait bien de l'app (téléphone verrouillé, autre
 * application au premier plan), mais la toucher ne faisait rien —
 * aucun `notificationclick` n'écoutait, et le navigateur, lui, ne
 * ramène personne tout seul. On lisait « c'est prêt », puis il fallait
 * retrouver l'icône à la main, les doigts pleins de farine.
 *
 * Ce fichier est importé par le service worker généré au build
 * (voir `workbox.importScripts` dans vite.config.ts) : Workbox
 * réécrit tout le reste du fichier à chaque build, pas celui-ci.
 */

self.addEventListener('notificationclick', (evenement) => {
  // Elle a dit ce qu'elle avait à dire ; la laisser dans le centre de
  // notifications ferait croire à un minuteur encore en attente.
  evenement.notification.close()

  const cible = new URL(evenement.notification.data?.url ?? '/', self.location.origin)

  evenement.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

      // Une fenêtre déjà ouverte est la bonne : elle porte les minuteurs
      // en cours et l'écran de cuisson là où on l'avait laissé. En ouvrir
      // une seconde repartirait de la liste des recettes.
      for (const fenetre of fenetres) {
        if (new URL(fenetre.url).origin !== cible.origin) continue
        const focalisee = 'focus' in fenetre ? await fenetre.focus() : fenetre
        // Le panneau des minuteurs s'ouvre déjà tout seul quand ça sonne,
        // sauf s'il a été refermé entre-temps : ce message le rouvre, pour
        // que le geste finisse là où il promettait d'aller.
        focalisee?.postMessage?.({ type: 'minuteur-notification-cliquee' })
        return
      }

      // Plus aucune fenêtre : l'app a été balayée, ou le téléphone a
      // récupéré la mémoire. On la relance.
      if (self.clients.openWindow) await self.clients.openWindow(cible.href)
    })(),
  )
})
