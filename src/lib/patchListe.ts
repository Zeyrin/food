import type { ListState } from '../types'

/**
 * Ce qui a changé dans la liste du foyer, plutôt que la liste entière.
 *
 * La liste voyageait d'un seul bloc, dernier écrivain gagnant : deux
 * personnes qui cochaient en même temps en magasin s'effaçaient l'une
 * l'autre dès que leurs deux envois se croisaient (une à deux secondes
 * en 4G), et un plat ajouté au panier pendant que l'autre cochait
 * décochait sa case. On n'envoie donc plus que la différence, et la base
 * la fusionne case par case (`fusionner_liste`, migration-03).
 *
 * - `coche` et `dejaPossede` : seulement les cases touchées (`false`
 *   pour une case décochée) — deux cases différentes ne se gênent plus.
 * - `items` et `panier` : la liste entière, quand elle a changé.
 * - `remplacer` : l'état complet, qui écrase tout — c'est « vider le
 *   panier », qui doit repartir de zéro des deux côtés.
 */
export interface PatchListe {
  remplacer?: boolean
  coche?: Record<string, boolean>
  dejaPossede?: Record<string, boolean>
  items?: ListState['items']
  panier?: ListState['panier']
}

function diffCases(avant: Record<string, boolean> = {}, apres: Record<string, boolean> = {}) {
  const diff: Record<string, boolean> = {}
  for (const cle of new Set([...Object.keys(avant), ...Object.keys(apres)])) {
    if (!!avant[cle] !== !!apres[cle]) diff[cle] = !!apres[cle]
  }
  return Object.keys(diff).length > 0 ? diff : undefined
}

const memeJson = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Un état entièrement vidé : on le transmet tel quel, pas en différence. */
function estVide(etat: ListState): boolean {
  return (
    Object.values(etat.coche).every((v) => !v) &&
    Object.values(etat.dejaPossede).every((v) => !v) &&
    (etat.items ?? []).length === 0 &&
    (etat.panier ?? []).length === 0
  )
}

/** La différence entre deux états, ou `null` s'il n'y en a aucune. */
export function diffListe(avant: ListState, apres: ListState): PatchListe | null {
  if (estVide(apres) && !estVide(avant)) {
    return { remplacer: true, coche: {}, dejaPossede: {}, items: [], panier: [] }
  }
  const patch: PatchListe = {}
  const coche = diffCases(avant.coche, apres.coche)
  if (coche) patch.coche = coche
  const deja = diffCases(avant.dejaPossede, apres.dejaPossede)
  if (deja) patch.dejaPossede = deja
  if (!memeJson(avant.items, apres.items)) patch.items = apres.items ?? []
  if (!memeJson(avant.panier, apres.panier)) patch.panier = apres.panier ?? []
  return Object.keys(patch).length > 0 ? patch : null
}

/** L'état après le patch — la même règle que `fusionner_liste` côté base. */
export function appliquerPatch(etat: ListState, patch: PatchListe): ListState {
  if (patch.remplacer) {
    return {
      coche: { ...(patch.coche ?? {}) },
      dejaPossede: { ...(patch.dejaPossede ?? {}) },
      items: patch.items ?? [],
      panier: patch.panier ?? [],
    }
  }
  return {
    ...etat,
    coche: { ...etat.coche, ...(patch.coche ?? {}) },
    dejaPossede: { ...etat.dejaPossede, ...(patch.dejaPossede ?? {}) },
    ...(patch.items !== undefined ? { items: patch.items } : {}),
    ...(patch.panier !== undefined ? { panier: patch.panier } : {}),
  }
}

/** Deux patchs en attente l'un après l'autre → un seul, à envoyer au retour du réseau. */
export function fusionnerPatchs(premier: PatchListe | null, second: PatchListe): PatchListe {
  if (!premier || second.remplacer) return second
  if (premier.remplacer) {
    const etat = appliquerPatch(appliquerPatch({ coche: {}, dejaPossede: {} }, premier), second)
    return { remplacer: true, ...etat }
  }
  const fusion: PatchListe = {}
  const coche = { ...(premier.coche ?? {}), ...(second.coche ?? {}) }
  if (Object.keys(coche).length) fusion.coche = coche
  const deja = { ...(premier.dejaPossede ?? {}), ...(second.dejaPossede ?? {}) }
  if (Object.keys(deja).length) fusion.dejaPossede = deja
  const items = second.items ?? premier.items
  if (items !== undefined) fusion.items = items
  const panier = second.panier ?? premier.panier
  if (panier !== undefined) fusion.panier = panier
  return fusion
}

/**
 * Ce qui n'est pas encore parti, gardé sur l'appareil : fermer l'app en
 * magasin sans réseau ne doit pas perdre les cases cochées pour l'autre
 * téléphone. Une entrée par foyer.
 */
const cleAttente = (foyer: string) => `fffood:liste-attente:${foyer}`

export function lireAttente(foyer: string): PatchListe | null {
  try {
    const brut = localStorage.getItem(cleAttente(foyer))
    return brut ? (JSON.parse(brut) as PatchListe) : null
  } catch {
    return null
  }
}

export function ecrireAttente(foyer: string, patch: PatchListe | null): void {
  try {
    if (patch) localStorage.setItem(cleAttente(foyer), JSON.stringify(patch))
    else localStorage.removeItem(cleAttente(foyer))
  } catch {
    /* stockage refusé : l'attente vit seulement en mémoire */
  }
}
