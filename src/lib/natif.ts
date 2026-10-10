/**
 * Ce qui change quand FFFood tourne dans l'app des stores (Capacitor)
 * plutôt que dans un navigateur.
 *
 * Le bundle est le même ; seules trois choses ne tiennent plus dans une
 * WebView embarquée, et c'est ici qu'on les rattrape :
 * - pas de service worker : les mises à jour passent par le store, et
 *   les alertes de minuteur par des notifications locales programmées ;
 * - l'origine de la page est `https://localhost` (Android) ou
 *   `capacitor://localhost` (iOS) : un lien partagé doit viser le site ;
 * - ni `navigator.share` ni le verrou d'écran ne sont garantis.
 */
import { KeepAwake } from '@capacitor-community/keep-awake'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Share } from '@capacitor/share'
import { traduire } from './i18n'
import type { Minuteur } from './minuteurs'

export { NATIF } from './plateforme'

export async function partagerTexte(titre: string, texte: string): Promise<void> {
  await Share.share({ title: titre, text: texte })
}

export async function garderEcranAllume(actif: boolean): Promise<void> {
  try {
    if (actif) await KeepAwake.keepAwake()
    else await KeepAwake.allowSleep()
  } catch {
    /* plateforme sans verrou d'écran : la cuisson se fait écran éteint */
  }
}

/* --- Minuteurs ---------------------------------------------------------

   Dans la WebView, le JavaScript s'arrête dès que l'app passe en
   arrière-plan : une notification décidée au moment où le minuteur
   sonne ne partirait jamais. On la programme donc dès le lancement, à
   l'heure de fin, et c'est le système qui la déclenche. */

/** Les identifiants de notification sont des entiers ; les minuteurs, des UUID. */
function idNotification(minuteur: Minuteur): number {
  let h = 0
  for (const c of minuteur.id) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return Math.abs(h) || 1
}

let permissionDemandee = false

export async function demanderNotificationsNatives(): Promise<void> {
  if (permissionDemandee) return
  permissionDemandee = true
  try {
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'prompt' || display === 'prompt-with-rationale') {
      await LocalNotifications.requestPermissions()
    }
  } catch {
    /* refusé : le bandeau et le bip restent quand l'app est ouverte */
  }
}

/**
 * Aligne les notifications programmées sur la liste des minuteurs : on
 * annule tout ce qui est en attente puis on reprogramme ceux qui ne
 * sont pas encore écoulés. Appelé à chaque ajout ou retrait.
 */
export async function programmerMinuteurs(minuteurs: Minuteur[]): Promise<void> {
  try {
    const { notifications } = await LocalNotifications.getPending()
    if (notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: notifications.map(({ id }) => ({ id })) })
    }
    const aVenir = minuteurs.filter((m) => m.fin > Date.now())
    if (aVenir.length === 0) return
    await LocalNotifications.schedule({
      notifications: aVenir.map((m) => ({
        id: idNotification(m),
        title: m.nom,
        body: traduire('notificationMinuteur.corps', { titre: m.recetteTitre }),
        schedule: { at: new Date(m.fin), allowWhileIdle: true },
      })),
    })
  } catch {
    /* permission refusée : rien ne sort de l'app, le bandeau reste */
  }
}

/** Toucher l'alerte rouvre l'app : on y montre les minuteurs. */
export function ecouterClicNotificationNative(quandClique: () => void): () => void {
  const abonnement = LocalNotifications.addListener('localNotificationActionPerformed', quandClique)
  return () => void abonnement.then((a) => a.remove())
}

export async function fermerNotificationsNatives(): Promise<void> {
  try {
    await LocalNotifications.removeAllDeliveredNotifications()
  } catch {
    /* rien à fermer */
  }
}
