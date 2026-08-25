import type { Nom as IconeNom } from './components/Icone'

/**
 * Les rayons d'un magasin. C'est la seule chose qu'une recette a le
 * droit de dire sur l'endroit où s'achète un ingrédient : une carotte
 * est au rayon fruits & légumes pour tout le monde, alors que « chez
 * le primeur » ou « à l'Intermarché » ne vaut que pour celui qui a
 * écrit la recette. Le magasin, lui, est un choix de foyer — il se
 * règle dans l'app (`src/lib/magasins.ts`), et le corpus reste
 * partageable.
 *
 * `autre` est réservé aux items ajoutés à la main sur la liste : on ne
 * demande pas à quelqu'un qui tape « papier toilette » de choisir un
 * rayon.
 */
export const RAYONS = {
  'fruits-legumes': { label: 'Fruits & légumes', order: 1, icone: 'feuille' as IconeNom },
  'viande-poisson': { label: 'Viande & poisson', order: 2, icone: 'poisson' as IconeNom },
  cremerie: { label: 'Crèmerie & frais', order: 3, icone: 'lait' as IconeNom },
  boulangerie: { label: 'Pain & pâtisserie', order: 4, icone: 'pain' as IconeNom },
  epicerie: { label: 'Épicerie', order: 5, icone: 'boite' as IconeNom },
  surgeles: { label: 'Surgelés', order: 6, icone: 'flocon' as IconeNom },
  boissons: { label: 'Boissons', order: 7, icone: 'bouteille' as IconeNom },
  autre: { label: 'Ajouté à la main', order: 8, icone: 'plus' as IconeNom },
} as const

export type RayonId = keyof typeof RAYONS

/** Les rayons dans l'ordre où on les traverse. */
export const RAYONS_ORDONNES = (Object.keys(RAYONS) as RayonId[]).sort(
  (a, b) => RAYONS[a].order - RAYONS[b].order,
)


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
  /** Où ça se trouve dans un magasin, pas dans quel magasin. */
  rayon: RayonId
  /**
   * Ancien champ : l'app rangeait chaque ingrédient dans un magasin
   * nommé en dur (« intermarche », « primeur »). Les recettes déjà
   * collées par les utilisateurs le portent encore, on le relit pour
   * en déduire un rayon (`rayonDe`), on ne l'écrit plus.
   * @deprecated
   */
  magasin?: string
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
  /**
   * Photo du plat, servie avec l'app (`/plats/<id>.webp`). Facultative : une
   * recette collée depuis l'app n'en a pas, et la vignette teintée prend
   * alors le relais.
   */
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
  rayon: RayonId
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
