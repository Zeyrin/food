import type { Nom as IconeNom } from './components/Icone'

/**
 * Un magasin. Ajouter une entrée ici suffit à en créer un nouveau.
 * `autre` est réservé aux items ajoutés à la main sur la liste — une
 * recette n'y range jamais un ingrédient.
 */
export const STORES = {
  intermarche: { label: 'Intermarché', order: 1, icone: 'boite' as IconeNom },
  primeur: { label: 'Primeur & asiat', order: 2, icone: 'feuille' as IconeNom },
  autre: { label: 'Ajouté à la main', order: 3, icone: 'alerte' as IconeNom },
} as const

export type StoreId = keyof typeof STORES

/**
 * Unités autorisées. `piece` couvre tout ce qui se compte
 * (3 oignons, 2 citrons). Les unités approximatives (`cs`, `cc`,
 * `pincee`) ne sont jamais converties : elles s'additionnent
 * entre elles ou restent côte à côte.
 */
export const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'cs', 'cc', 'pincee', 'piece', 'botte'] as const
export type Unit = (typeof UNITS)[number]

export interface RecipeIngredient {
  /**
   * Nom canonique. C'est la clé d'agrégation : deux recettes qui
   * écrivent « crème fraîche » partagent la même ligne de liste.
   * `npm run lint:recipes` signale les quasi-doublons.
   */
  nom: string
  quantite: number
  unite: Unit
  magasin: StoreId
  /** Sel, poivre, huile — exclu de la liste par défaut. */
  placard?: boolean
}

export interface Recipe {
  id: string
  titre: string
  /** Temps total en minutes, du plan de travail à l'assiette. */
  temps: number
  /** Nombre de parts que couvrent les quantités ci-dessous. */
  portions: number
  /** Étiquettes libres : « asiatique », « rapide », « végé », « four »… */
  tags: string[]
  ingredients: RecipeIngredient[]
  etapes: string[]
  /** URL d'une photo du plat. Absente la plupart du temps : une vignette générée prend le relais. */
  image?: string
  /** Une phrase qui donne envie, affichée sous le titre sur la fiche. */
  description?: string
  /** Tour de main, affiché en mode cuisson. `astuces[i]` accompagne `etapes[i]`. */
  astuces?: string[]
}

/** Une recette retenue pour la semaine, avec son nombre de parts. */
export interface BasketEntry {
  recipeId: string
  portions: number
}

/** Une ligne de liste de courses, après agrégation. */
export interface ListItem {
  /** `${nom}|${unite}` — stable, sert de clé de synchro. */
  key: string
  nom: string
  quantite: number
  unite: Unit
  magasin: StoreId
  /** Recettes qui ont contribué à cette ligne. */
  origines: string[]
}

/** Un item ajouté à la main sur la liste, hors recette (ex: papier toilette). */
export interface ItemLibre {
  id: string
  nom: string
}

/** État partagé entre les deux téléphones. */
export interface ListState {
  /** Coché en magasin. */
  coche: Record<string, boolean>
  /** Écarté à la passe « j'ai déjà ». */
  dejaPossede: Record<string, boolean>
  /** Items ajoutés à la main, en plus de ceux dérivés des recettes. */
  items?: ItemLibre[]
  /**
   * Les recettes retenues pour la semaine. Elles voyagent avec la liste
   * plutôt que dans une table à elles : c'est la même décision de foyer
   * (« on mange ça cette semaine » produit « il faut acheter ça »), et
   * les garder dans la même ligne évite qu'une écriture de panier et une
   * case cochée s'écrasent l'une l'autre.
   */
  panier?: BasketEntry[]
}

export type Verdict = 'refaire' | 'jamais'

/** Les quatre onglets de la barre de navigation principale. */
export type Onglet = 'propose' | 'panier' | 'liste' | 'cuisson'
