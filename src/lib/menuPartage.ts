/**
 * Le menu de la semaine qu'on envoie à quelqu'un : les plats du panier et
 * leurs parts, dans un lien qui remplit le panier de celui qui l'ouvre.
 *
 * Jusqu'ici, ce qui voyageait était soit une recette seule (sa page
 * statique), soit une maison entière (le lien d'invitation, qui donne la
 * liste et le reste). Entre les deux, rien pour dire « voilà ce qu'on
 * mange cette semaine, fais pareil » sans faire entrer l'autre chez soi.
 *
 * Le menu tient dans le fragment (`#/m/mapo-tofu:2,curry-pois-chiches:4`) :
 * pas de serveur, pas de maison à créer pour l'envoyer, et rien qui
 * sorte de la conversation où le lien est collé. Seuls des identifiants
 * du corpus livré avec l'app y entrent — une recette écrite par la maison
 * n'existe pas chez celui qui reçoit. Le chemin `/menu/`, lui, est vu des
 * robots d'aperçu : c'est la page prérendue qui donne au lien son propre
 * aperçu (voir `scripts/prerender.mjs`).
 *
 * Fonctions pures, testées.
 */
import type { BasketEntry } from '../types'
import { ORIGINE_PUBLIQUE } from './plateforme'

export interface MenuRecu {
  plats: BasketEntry[]
  /** Le prénom de qui envoie, `null` quand le lien n'en porte pas. */
  de: string | null
}

/** Même limite que le prénom du profil (voir `invitation.ts`). */
const LONGUEUR_PRENOM = 30
/** Trois repas par jour pendant une semaine : au-delà, ce n'est plus un menu. */
const PLATS_MAX = 21
const PARTS_MAX = 50

const FRAGMENT = /^#\/m\/([^?]*)(?:\?(.*))?$/i
const PLAT = /^([a-z0-9-]+)(?::(\d{1,3}))?$/

export function lireMenu(hash: string): MenuRecu | null {
  const [, corps, requete] = hash.match(FRAGMENT) ?? []
  if (corps === undefined) return null
  const plats: BasketEntry[] = []
  for (const morceau of corps.split(',')) {
    const [, recipeId, parts] = morceau.trim().toLowerCase().match(PLAT) ?? []
    if (!recipeId || plats.some((p) => p.recipeId === recipeId)) continue
    const portions = Math.min(PARTS_MAX, Number(parts) || 0)
    plats.push({ recipeId, portions: portions >= 1 ? portions : 2 })
    if (plats.length === PLATS_MAX) break
  }
  if (plats.length === 0) return null
  const de = new URLSearchParams(requete ?? '').get('de')?.trim().slice(0, LONGUEUR_PRENOM) || null
  return { plats, de }
}

/**
 * Toujours l'adresse publique, comme la signature de liste : c'est
 * quelqu'un qui n'a peut-être pas FFFood qui ouvre le lien, et une
 * origine de développement ou `localhost` (l'app des stores) ne mène nulle
 * part chez lui.
 */
export function lienMenu(plats: BasketEntry[], prenom: string, origine: string = ORIGINE_PUBLIQUE): string {
  const corps = plats.map((p) => `${p.recipeId}:${p.portions}`).join(',')
  const de = prenom.trim().slice(0, LONGUEUR_PRENOM)
  return `${origine}/menu/#/m/${corps}${de ? `?de=${encodeURIComponent(de)}` : ''}`
}

/**
 * Ajouter le menu reçu au panier d'ici, sans rien en retirer : on peut
 * recevoir un menu alors qu'on a déjà commencé sa semaine. Un plat déjà
 * dans le panier garde ses parts, celles d'ici décrites pour cette maison.
 */
export function ajouterMenu(panier: BasketEntry[], plats: BasketEntry[]): BasketEntry[] {
  const deja = new Set(panier.map((e) => e.recipeId))
  return [...panier, ...plats.filter((p) => !deja.has(p.recipeId))]
}
