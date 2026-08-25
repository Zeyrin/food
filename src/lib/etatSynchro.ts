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
 * Un `Set` d'abonnés plutôt qu'un état React : `sync.ts` est un module
 * sans composant, appelé depuis des callbacks, et n'a pas à connaître
 * l'arbre.
 */

export type EtatSynchro = 'inconnu' | 'ok' | 'refuse'

let etat: EtatSynchro = 'inconnu'
let motif: string | null = null

const abonnes = new Set<() => void>()

function diffuser() {
  for (const abonne of abonnes) abonne()
}

/** Une écriture est passée : ce qui avait échoué avant n'est plus vrai. */
export function signalerSynchroOk(): void {
  if (etat === 'ok') return
  etat = 'ok'
  motif = null
  diffuser()
}

/** Une écriture a été refusée par le serveur (policy, table absente…). */
export function signalerSynchroRefusee(message: string): void {
  // Le premier refus est le plus informatif : les suivants sont
  // généralement la même cause qui se répète.
  if (etat === 'refuse') return
  etat = 'refuse'
  motif = message
  diffuser()
}

export function lireEtatSynchro(): EtatSynchro {
  return etat
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
