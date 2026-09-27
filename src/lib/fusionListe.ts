import type { ListState } from '../types'

/**
 * Fusionner deux états de liste plutôt que laisser le dernier écrivain
 * gagner.
 *
 * La liste du foyer est une seule ligne JSON. Jusqu'ici chaque case
 * cochée republiait tout le document, et le dernier arrivé écrasait le
 * reste. En pratique, ça perdait des cases :
 *
 * - deux appuis rapprochés partaient en deux écritures qui pouvaient
 *   arriver dans le désordre, et l'écho temps réel de la plus ancienne
 *   revenait décocher à l'écran ce qu'on venait de cocher ;
 * - un téléphone resté en veille avec une liste périmée republiait
 *   celle-ci au premier appui, effaçant les cases de l'autre téléphone ;
 * - une écriture échouée hors ligne n'était jamais retentée.
 *
 * Chaque case porte donc son horodatage (`horodatage["c:ail"]`), une
 * case décochée reste écrite à `false` pour que son horodatage voyage,
 * et deux états se fusionnent entrée par entrée : la plus récente gagne,
 * dans n'importe quel ordre d'arrivée. Les items ajoutés à la main et le
 * panier se fusionnent d'un bloc (`items`, `panier`) — deux personnes qui
 * les modifient à la même seconde sont un cas trop rare pour justifier
 * plus. « Vider le panier » pose une remise à zéro (`remise`) : tout ce
 * qui la précède est effacé, sans quoi l'autre téléphone ferait revivre
 * les anciennes cases à la fusion suivante.
 *
 * Les horloges de deux téléphones ne sont pas d'accord à la seconde près.
 * L'horloge locale avance donc toujours au-delà du plus grand horodatage
 * vu (`observer`) : un geste fait après avoir reçu un état l'emporte sur
 * lui, même si ce téléphone-ci retarde.
 */

type Champ = 'coche' | 'dejaPossede'
const PREFIXE: Record<Champ, string> = { coche: 'c:', dejaPossede: 'd:' }

let horloge = 0

/** Un horodatage strictement plus grand que tout ce qu'on a émis ou reçu. */
export function maintenant(): number {
  horloge = Math.max(Date.now(), horloge + 1)
  return horloge
}

/** Fait avancer l'horloge au-delà d'un état reçu. */
function observer(etat: ListState): void {
  for (const t of Object.values(etat.horodatage ?? {})) if (t > horloge) horloge = t
  if ((etat.remise ?? 0) > horloge) horloge = etat.remise!
}

const ts = (etat: ListState, cle: string) => etat.horodatage?.[cle] ?? 0

/**
 * Horodate ce qui a changé entre `prec` et `suivant`. Les écrans
 * continuent de produire des états entiers ; c'est ici qu'on déduit
 * quelles entrées ils ont touchées.
 */
export function horodater(prec: ListState, suivant: ListState, remise = false): ListState {
  const t = maintenant()
  if (remise) {
    return { coche: {}, dejaPossede: {}, items: suivant.items ?? [], panier: suivant.panier ?? [], horodatage: { items: t, panier: t }, remise: t }
  }
  const horodatage = { ...prec.horodatage, ...suivant.horodatage }
  const resultat: ListState = { ...suivant, coche: { ...suivant.coche }, dejaPossede: { ...suivant.dejaPossede }, horodatage }
  for (const champ of ['coche', 'dejaPossede'] as const) {
    const cles = new Set([...Object.keys(prec[champ]), ...Object.keys(suivant[champ])])
    for (const cle of cles) {
      const avant = prec[champ][cle] === true
      const apres = suivant[champ][cle] === true
      if (avant !== apres) {
        resultat[champ][cle] = apres
        horodatage[PREFIXE[champ] + cle] = t
      }
    }
  }
  if (JSON.stringify(prec.items ?? []) !== JSON.stringify(suivant.items ?? [])) horodatage.items = t
  if (JSON.stringify(prec.panier ?? []) !== JSON.stringify(suivant.panier ?? [])) horodatage.panier = t
  return resultat
}

/** L'union de deux états, entrée par entrée, la plus récente l'emportant. */
export function fusionner(a: ListState, b: ListState): ListState {
  observer(a)
  observer(b)
  const remise = Math.max(a.remise ?? 0, b.remise ?? 0)
  const horodatage: Record<string, number> = {}
  const resultat: ListState = { coche: {}, dejaPossede: {}, horodatage }
  if (remise) resultat.remise = remise

  for (const champ of ['coche', 'dejaPossede'] as const) {
    const cles = new Set([...Object.keys(a[champ] ?? {}), ...Object.keys(b[champ] ?? {})])
    for (const cle of cles) {
      const h = PREFIXE[champ] + cle
      const [ta, tb] = [ts(a, h), ts(b, h)]
      const t = Math.max(ta, tb)
      // Antérieure à la remise à zéro : elle appartenait à la semaine d'avant.
      if (remise && t < remise) continue
      // À égalité — deux états d'avant les horodatages —, une case cochée
      // d'un côté le reste : mieux vaut une case de trop qu'un achat oublié.
      const valeur =
        tb > ta ? b[champ]?.[cle] : ta > tb ? a[champ]?.[cle] : a[champ]?.[cle] === true || b[champ]?.[cle] === true ? true : (a[champ]?.[cle] ?? b[champ]?.[cle])
      if (valeur === undefined) continue
      resultat[champ][cle] = valeur
      if (t) horodatage[h] = t
    }
  }

  // À égalité, le distant (`b`) : c'était déjà la règle avant les
  // horodatages, et le panier d'un foyer vit sur le serveur.
  const bloc = <K extends 'items' | 'panier'>(nom: K): ListState[K] => {
    const [ta, tb] = [ts(a, nom), ts(b, nom)]
    if (Math.max(ta, tb)) horodatage[nom] = Math.max(ta, tb)
    return tb > ta ? b[nom] : ta > tb ? a[nom] : (b[nom] ?? a[nom])
  }
  const items = bloc('items')
  const panier = bloc('panier')
  if (items !== undefined) resultat.items = items
  if (panier !== undefined) resultat.panier = panier
  return resultat
}

/**
 * `local` sait-il quelque chose que `distant` ignore ? Si oui, le
 * serveur est en retard sur ce téléphone et il faut republier — c'est ce
 * qui fait converger deux téléphones qui ont écrit chacun de leur côté.
 */
export function enAvanceSur(local: ListState, distant: ListState): boolean {
  if ((local.remise ?? 0) > (distant.remise ?? 0)) return true
  for (const [cle, t] of Object.entries(local.horodatage ?? {})) if (t > ts(distant, cle)) return true
  return false
}
