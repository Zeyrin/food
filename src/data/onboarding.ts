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
  /**
   * L'étape attend un geste dans l'app plutôt qu'un appui sur « Suivant » :
   * `ajout`, c'est un plat qui entre au panier. La visite avance d'elle-même
   * quand il arrive — « Suivant » reste là pour qui ne veut pas choisir.
   */
  attend?: 'ajout'
}

/**
 * Trois étapes, et la première se fait avec le doigt.
 *
 * La visite d'avant faisait neuf cartes et décrivait l'interface — la
 * recherche, les filtres, l'ajout par IA, les réglages — à quelqu'un qui
 * n'avait encore rien choisi. C'est l'écran où décroche le visiteur venu
 * d'une vidéo de quinze secondes. On lui fait vivre à la place le seul
 * moment qui explique l'app : il ajoute un plat, et la liste de courses
 * existe déjà. Le reste se découvre en s'en servant.
 */
export const VISITE_GUIDEE: EtapeVisiteStructure[] = [
  { cible: 'plat-exemple', onglet: 'propose', attend: 'ajout' },
  { cible: 'nav-liste', onglet: 'liste' },
  { cible: 'nav-cuisson', onglet: 'cuisson' },
]
