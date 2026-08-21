import type { Onglet } from '../types'

/**
 * Structure de la visite guidée (voir components/TourGuide.tsx). Chaque
 * étape désigne un élément réel de l'interface via son attribut
 * `data-tour`, et l'onglet qui doit être actif pour qu'il existe à
 * l'écran — la visite bascule l'app dessus toute seule. `cible: null`
 * affiche une carte centrée sans repérer d'élément (ouverture et
 * clôture de la visite). `onglet: null` garde l'onglet déjà actif.
 *
 * Les titres et textes vivent dans lib/i18n.ts (clé `onboarding`, même
 * ordre que ce tableau) pour rester traduisibles ; ce fichier ne porte
 * que la structure, commune aux deux langues.
 */
export interface EtapeVisiteStructure {
  cible: string | null
  onglet: Onglet | null
}

export const VISITE_GUIDEE: EtapeVisiteStructure[] = [
  { cible: null, onglet: 'propose' },
  { cible: 'recherche-propose', onglet: 'propose' },
  { cible: 'filtres-propose', onglet: 'propose' },
  { cible: 'nav-panier', onglet: 'panier' },
  { cible: 'nav-ajouter', onglet: 'panier' },
  { cible: 'nav-liste', onglet: 'liste' },
  { cible: 'nav-cuisson', onglet: 'cuisson' },
  { cible: 'reglages', onglet: null },
  { cible: null, onglet: 'propose' },
]
