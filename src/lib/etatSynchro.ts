/**
 * Est-ce que ce qu'on écrit arrive vraiment sur l'autre téléphone ?
 *
 * Jusqu'ici les écritures refusées se contentaient d'un `console.warn` :
 * une policy mal réglée ou une réplication non activée donnait une app
 * qui a l'air de marcher et ne synchronise jamais. C'est le pire mode de
 * panne pour un foyer à deux — chacun coche sa liste, personne ne voit
 * celle de l'autre, et rien ne le dit.
 *
 * Distinct de « hors ligne » (`useEnLigne`), qui est normal en magasin et
 * se rattrape tout seul au retour du réseau. Ici, le réseau est là et le
 * serveur refuse : ça ne se rattrapera pas sans intervention.
 *
 * Encore faut-il dire laquelle : voir `CauseSynchro`.
 *
 * Un `Set` d'abonnés plutôt qu'un état React : `sync.ts` est un module
 * sans composant, appelé depuis des callbacks, et n'a pas à connaître
 * l'arbre.
 */

export type EtatSynchro = 'inconnu' | 'ok' | 'refuse'

/**
 * Quatre pannes distinctes se présentaient sous la même phrase — « le
 * serveur refuse les écritures » — alors qu'elles n'ont ni les mêmes
 * conséquences ni le même remède. La pire confusion était le temps réel :
 * un canal muet n'empêche *rien* d'être écrit, il empêche seulement
 * l'autre téléphone de voir la liste bouger en direct. Annoncer que
 * « cet appareil garde tout en local » envoie chercher une policy
 * d'écriture parfaitement saine, quand il fallait cocher trois cases
 * dans Database → Replication.
 */
export type CauseSynchro =
  /** Connexion anonyme refusée : `auth.uid()` est nul, la base refuse tout. */
  | 'session'
  /** `reclamer_foyer` a échoué : l'appareil n'est pas membre de ce foyer. */
  | 'acces'
  /** Un canal Realtime n'a pas pu s'abonner. Les écritures, elles, passent. */
  | 'tempsReel'
  /** Une écriture a été refusée : ce qui est fait ici ne part pas. */
  | 'ecriture'

/**
 * Du moins grave au plus grave. Le premier refus reste le plus
 * informatif — les suivants répètent généralement la même cause — mais un
 * refus plus lourd doit pouvoir remplacer un refus léger : les canaux
 * s'abonnent au montage, bien avant la première écriture, et sans ce
 * classement un temps réel muet au démarrage masquerait pour toujours une
 * écriture refusée ensuite.
 */
const GRAVITE: Record<CauseSynchro, number> = {
  tempsReel: 1,
  ecriture: 2,
  acces: 3,
  session: 4,
}

let etat: EtatSynchro = 'inconnu'
let cause: CauseSynchro | null = null
let motif: string | null = null

const abonnes = new Set<() => void>()

function diffuser() {
  for (const abonne of abonnes) abonne()
}

/** Une écriture est passée. */
export function signalerSynchroOk(): void {
  // Elle ne dit rien du canal temps réel : les deux chemins sont séparés
  // côté Supabase — REST d'un côté, WebSocket et publication
  // `supabase_realtime` de l'autre. Effacer le second parce que le premier
  // marche, c'est faire disparaître le diagnostic au premier produit coché,
  // pour une panne qui, elle, ne s'est pas réparée.
  if (cause !== null && cause !== 'ecriture') return
  if (etat === 'ok') return
  etat = 'ok'
  cause = null
  motif = null
  diffuser()
}

/** Le serveur a refusé quelque chose. `motif` porte le message brut. */
export function signalerSynchroRefusee(nouvelle: CauseSynchro, message: string): void {
  if (etat === 'refuse' && cause !== null && GRAVITE[nouvelle] <= GRAVITE[cause]) return
  etat = 'refuse'
  cause = nouvelle
  motif = message
  diffuser()
}

export function lireEtatSynchro(): EtatSynchro {
  return etat
}

export function lireCauseSynchro(): CauseSynchro | null {
  return cause
}

export function lireMotifSynchro(): string | null {
  return motif
}

export function abonnerSynchro(abonne: () => void): () => void {
  abonnes.add(abonne)
  return () => {
    abonnes.delete(abonne)
  }
}
