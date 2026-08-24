import type { RayonId } from '../types'
import { RAYONS } from '../types'

/**
 * Correspondance de rattrapage pour les recettes écrites avant les
 * rayons, quand chaque ingrédient nommait un magasin en dur. Elles
 * vivent chez les utilisateurs (catalogue collé, synchronisé) : on ne
 * peut pas les réécrire à distance, seulement les relire.
 *
 * La traduction est grossière — « primeur » regroupait le frais et
 * l'épicerie asiatique — mais elle ne peut pas faire pire que
 * l'ancien affichage, et une recette rouverte dans l'écran d'édition
 * repart avec un vrai rayon.
 */
const ANCIENS_MAGASINS: Record<string, RayonId> = {
  primeur: 'fruits-legumes',
  intermarche: 'epicerie',
  autre: 'autre',
}

const estRayon = (v: unknown): v is RayonId => typeof v === 'string' && v in RAYONS

/**
 * Le rayon d'un ingrédient, quelle que soit l'époque à laquelle il a
 * été écrit. Rien de reconnaissable tombe dans « épicerie » : mieux
 * vaut une ligne mal rangée qu'une ligne disparue de la liste.
 */
export function rayonDe(ing: { rayon?: unknown; magasin?: unknown }): RayonId {
  if (estRayon(ing.rayon)) return ing.rayon
  if (typeof ing.magasin === 'string' && ing.magasin in ANCIENS_MAGASINS) {
    return ANCIENS_MAGASINS[ing.magasin]!
  }
  return 'epicerie'
}
