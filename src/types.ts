/** Un magasin. Ajouter une entrée ici suffit à en créer un nouveau. */
export const STORES = {
  intermarche: { label: 'Intermarché', order: 1 },
  primeur: { label: 'Primeur & asiat', order: 2 },
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

/** État partagé entre les deux téléphones. */
export interface ListState {
  /** Coché en magasin. */
  coche: Record<string, boolean>
  /** Écarté à la passe « j'ai déjà ». */
  dejaPossede: Record<string, boolean>
}

export type Verdict = 'refaire' | 'jamais'
