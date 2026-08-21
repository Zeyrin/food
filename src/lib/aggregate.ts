import type { BasketEntry, ListItem, Recipe, StoreId, Unit } from '../types'
import { STORES } from '../types'

/**
 * Unités convertibles vers une unité de base. Tout ce qui n'est pas
 * ici (cs, cc, pincée, pièce, botte) reste tel quel : on n'invente
 * pas qu'un oignon pèse 110 g.
 */
const CONVERSIONS: Partial<Record<Unit, { base: Unit; facteur: number }>> = {
  kg: { base: 'g', facteur: 1000 },
  l: { base: 'ml', facteur: 1000 },
  cl: { base: 'ml', facteur: 10 },
}

function toBase(quantite: number, unite: Unit): { quantite: number; unite: Unit } {
  const conv = CONVERSIONS[unite]
  return conv ? { quantite: quantite * conv.facteur, unite: conv.base } : { quantite, unite }
}

/**
 * Panier → liste de courses.
 *
 * Regroupe par (nom canonique, unité de base). Deux unités
 * inconciliables sur le même ingrédient produisent deux lignes —
 * c'est voulu : « 200 g de tomates » et « 1 boîte de tomates »
 * ne s'additionnent pas.
 */
export function buildList(
  basket: BasketEntry[],
  recipes: Recipe[],
  options: { inclurePlacard?: boolean } = {},
): ListItem[] {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const acc = new Map<string, ListItem>()

  for (const entry of basket) {
    const recipe = byId.get(entry.recipeId)
    if (!recipe) continue

    const facteur = entry.portions / recipe.portions

    for (const ing of recipe.ingredients) {
      if (ing.placard && !options.inclurePlacard) continue

      const { quantite, unite } = toBase(ing.quantite * facteur, ing.unite)
      const key = `${ing.nom}|${unite}`
      const existant = acc.get(key)

      if (existant) {
        existant.quantite += quantite
        if (!existant.origines.includes(recipe.titre)) existant.origines.push(recipe.titre)
      } else {
        acc.set(key, {
          key,
          nom: ing.nom,
          quantite,
          unite,
          magasin: ing.magasin,
          origines: [recipe.titre],
        })
      }
    }
  }

  return [...acc.values()]
    .map((item) => ({ ...item, quantite: arrondir(item.quantite, item.unite) }))
    .sort((a, b) => STORES[a.magasin].order - STORES[b.magasin].order || a.nom.localeCompare(b.nom, 'fr'))
}

/**
 * Recette recalculée pour un nombre de parts différent de celui du
 * catalogue — même facteur que `buildList`, mais gardé par recette
 * plutôt qu'agrégé : le mode cuisson doit afficher les doses qui
 * correspondent à ce qui a été retenu dans le panier, pas la recette
 * telle qu'écrite à l'origine.
 */
export function redimensionnerRecette(recette: Recipe, portionsCible: number): Recipe {
  if (portionsCible === recette.portions) return recette
  const facteur = portionsCible / recette.portions
  return {
    ...recette,
    portions: portionsCible,
    ingredients: recette.ingredients.map((ing) => ({ ...ing, quantite: ing.quantite * facteur })),
  }
}

/**
 * Une quantité de courses n'a pas besoin d'être juste au gramme.
 * On arrondit à quelque chose qu'on peut lire d'un coup d'œil
 * dans un rayon.
 */
function arrondir(quantite: number, unite: Unit): number {
  if (unite === 'g' || unite === 'ml') {
    if (quantite >= 100) return Math.round(quantite / 10) * 10
    return Math.round(quantite / 5) * 5
  }
  if (unite === 'piece' || unite === 'botte') return Math.ceil(quantite)
  return Math.round(quantite * 2) / 2
}

/** Regroupe la liste par magasin, dans l'ordre de STORES. */
export function groupByStore(items: ListItem[]): Array<{ magasin: StoreId; items: ListItem[] }> {
  const ids = (Object.keys(STORES) as StoreId[]).sort((a, b) => STORES[a].order - STORES[b].order)
  return ids
    .map((magasin) => ({ magasin, items: items.filter((i) => i.magasin === magasin) }))
    .filter((g) => g.items.length > 0)
}

/** Suffixes lisibles. Les unités qui s'accordent reçoivent leur vraie
 *  forme plutôt qu'un « (s) » : « 1 botte », « 2 bottes ». */
const AFFICHAGE: Partial<Record<Unit, (n: number) => string>> = {
  piece: () => '',
  pincee: (n) => (n > 1 ? ' pincées' : ' pincée'),
  botte: (n) => (n > 1 ? ' bottes' : ' botte'),
  cs: () => ' c. à s.',
  cc: () => ' c. à c.',
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }

/**
 * « 0.5 c. à c. » ne se lit pas : en cuisine on écrit ½. Le reste passe
 * en virgule décimale, comme tout nombre écrit en français.
 */
function formatNombre(n: number): string {
  const entier = Math.floor(n)
  const fraction = FRACTIONS[String(+(n - entier).toFixed(2))]
  if (fraction) return entier > 0 ? `${entier}${fraction}` : fraction
  return String(n).replace('.', ',')
}

export function formatQuantite(item: Pick<ListItem, 'quantite' | 'unite'>): string {
  const suffixe = AFFICHAGE[item.unite]?.(item.quantite) ?? ` ${item.unite}`
  return `${formatNombre(item.quantite)}${suffixe}`.trim()
}

/**
 * « le reblochon 1 » n'apprend rien : un nom au singulier dit déjà qu'il
 * y en a un. On ne colle une quantité que si elle porte une information
 * — « les carottes 2 », « les tortillas 6 ».
 */
const quantiteMuette = (ing: Pick<ListItem, 'quantite' | 'unite'>) =>
  ing.unite === 'piece' && ing.quantite <= 1

/** Ce dont l'annotation d'une étape a besoin d'un ingrédient. */
export type IngredientCite = Pick<ListItem, 'nom' | 'quantite' | 'unite'> & { placard?: boolean }

const sansAccents = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Mots de liaison : ni porteurs de sens dans un nom d'ingrédient, ni
 *  obstacle quand ils séparent deux de ses mots (« huile d'olive »). */
const LIAISONS = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'au', 'aux', 'a', 'en'])

/** « huile d'olive » → ["huile","olive"] ; « chou-fleur » → ["chou","fleur"]. */
const motsDuNom = (nom: string) =>
  sansAccents(nom)
    .split(/[^\p{L}]+/u)
    .filter((m) => m.length > 0 && !LIAISONS.has(m))

/**
 * Ces deux-là désignent aussi bien un ingrédient que ce qu'on est en
 * train de fabriquer : « la sauce nappe » ne parle pas de la sauce soja
 * de la liste, « la pâte doit rougir » pas de la pâte de miso. Ils
 * n'annotent donc que si le texte les qualifie. Au singulier seulement —
 * « pâtes » nomme le plat, et « cuire les pâtes » doit rester annoté.
 *
 * Volontairement court : les autres têtes soi-disant ambiguës (huile,
 * lait, cœur, galette) ne posaient problème que par l'annotation au
 * milieu du groupe nominal, réglée par consommerSuite. « Un filet
 * d'huile » désigne bien l'huile d'olive de la liste.
 */
const TETES_GENERIQUES = new Set(['sauce', 'pate'])

const pluriels = (mot: string) => (/(?:eau|eu)$/.test(mot) ? [mot + 'x'] : [mot + 's'])

const correspond = (brut: string, cible: string) =>
  brut === cible || pluriels(cible).includes(brut) || pluriels(brut).includes(cible)

/**
 * Depuis la fin d'un mot déjà reconnu, avale la suite du groupe nominal
 * tant qu'elle continue de nommer l'ingrédient : après « huile », les
 * mots « de » puis « sésame ». S'arrête à la première rupture — un mot
 * étranger, ou de la ponctuation entre les deux, signe la fin du groupe.
 */
function consommerSuite(
  texte: string,
  depuis: number,
  restants: string[],
): { fin: number; consommes: number } {
  const suite = /[\p{L}\p{M}]+/gu
  suite.lastIndex = depuis
  let fin = depuis
  let bord = depuis
  let i = 0
  let prochain: RegExpExecArray | null

  while (i < restants.length && (prochain = suite.exec(texte)) !== null) {
    if (!/^[\s'’-]*$/.test(texte.slice(bord, prochain.index))) break
    bord = prochain.index + prochain[0].length
    const mot = sansAccents(prochain[0])
    if (LIAISONS.has(mot)) continue
    if (!correspond(mot, restants[i]!)) break
    i += 1
    fin = bord
  }

  return { fin, consommes: i }
}

/**
 * Marqueur d'ingrédient dans une étape : « cuire les {pâtes} ». Même
 * idée que le `@ingrédient{}` de Cooklang — c'est l'auteur de la
 * recette qui désigne l'ingrédient, le logiciel n'a plus à le deviner.
 * Le texte entre accolades s'affiche tel quel, les accolades non.
 */
const MARQUEUR = /\{([^{}]+)\}/
const MARQUEURS = new RegExp(MARQUEUR, 'g')

/**
 * L'étape en texte nu, marqueurs retirés. Le mode cuisson passe par
 * `annoterEtape`, qui les remplace par leur libellé annoté de la dose ;
 * les aperçus (fiche recette, écran de préparation) veulent la même
 * phrase, sans les doses et surtout sans les accolades — elles s'y
 * affichaient telles quelles, « Couper la {tomate} » sur la fiche.
 */
export function etapeEnTexte(texte: string): string {
  return texte.replace(MARQUEURS, '$1')
}

/** Retrouve l'ingrédient désigné par un marqueur : d'abord au nom
 *  exact, sinon sur son premier mot (« {pâtes} » → « pâtes longues »). */
function ingredientDesigne<T extends Pick<ListItem, 'nom'>>(
  libelle: string,
  ingredients: T[],
): T | undefined {
  const cible = sansAccents(libelle).trim()
  return (
    ingredients.find((ing) => sansAccents(ing.nom) === cible) ??
    ingredients.find((ing) => {
      const tete = motsDuNom(ing.nom)[0]
      const premier = motsDuNom(libelle)[0]
      return tete !== undefined && premier !== undefined && correspond(premier, tete)
    })
  )
}

/**
 * Étape marquée par son auteur : aucune devinette, on lit ce qui est
 * écrit. Un marqueur dont le nom ne correspond à rien s'affiche quand
 * même en texte normal — une faute de frappe ne doit pas faire
 * disparaître un morceau de la recette.
 */
function annoterMarqueurs(
  texte: string,
  ingredients: IngredientCite[],
): Array<{ texte: string; quantite?: string }> {
  const segments: Array<{ texte: string; quantite?: string }> = []
  let curseur = 0

  for (const m of texte.matchAll(MARQUEURS)) {
    const libelle = m[1]!
    const debut = m.index ?? 0
    const ing = ingredientDesigne(libelle, ingredients)
    segments.push({
      texte: texte.slice(curseur, debut) + libelle,
      ...(ing && !quantiteMuette(ing) ? { quantite: formatQuantite(ing) } : {}),
    })
    curseur = debut + m[0].length
  }

  if (curseur < texte.length) segments.push({ texte: texte.slice(curseur) })
  return segments
}

/**
 * Repère les ingrédients cités dans le texte d'une étape et découpe
 * celui-ci en segments, en annotant chaque mention de sa quantité.
 *
 * Deux régimes. Si l'étape porte des marqueurs `{…}`, ils font foi :
 * c'est la voie fiable, celle que remplit le prompt de génération. Sans
 * marqueur — les recettes écrites à la main, le corpus d'origine — on
 * retombe sur la reconnaissance heuristique décrite ci-dessous, qui
 * marche bien mais ne pourra jamais couvrir « la moitié du reblochon ».
 *
 * L'accroche se fait sur le premier mot du nom — le nom véritable, ce
 * qui suit n'étant qu'un qualificatif que la recette omet souvent
 * (« pâtes longues » citées comme « les pâtes »). La quantité se pose
 * après le groupe nominal entier, pas après ce premier mot : « l'huile
 * de sésame [1 c. à s.] », jamais « l'huile [1 c. à s.] de sésame ».
 * Singulier et pluriel sont acceptés. Les mots de moins de 4 lettres
 * sont ignorés — « ail », « sel », « riz » se retrouvent partout et
 * annoter chaque occurrence rendrait l'étape illisible.
 */
export function annoterEtape(
  texte: string,
  ingredients: IngredientCite[],
): Array<{ texte: string; quantite?: string }> {
  if (MARQUEUR.test(texte)) return annoterMarqueurs(texte, ingredients)

  const cibles = ingredients
    // Le placard est exclu de la reconnaissance : « poivrer avec le
    // poivre ½ c. à c. » n'aide personne. Un marqueur explicite, lui,
    // reste honoré — c'est l'auteur qui décide.
    .filter((ing) => !ing.placard && !quantiteMuette(ing))
    .map((ing) => ({ nom: ing.nom, mots: motsDuNom(ing.nom), quantite: formatQuantite(ing) }))
    .filter((c) => (c.mots[0]?.length ?? 0) >= 4)

  if (cibles.length === 0) return [{ texte }]

  // Un seul passage sur le texte, chaque ingrédient annoté une fois.
  const segments: Array<{ texte: string; quantite?: string }> = []
  const vus = new Set<string>()
  const regex = /[\p{L}\p{M}]+/gu
  let curseur = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(texte)) !== null) {
    const brut = sansAccents(m[0])
    const depuis = m.index + m[0].length

    // Plusieurs ingrédients peuvent partager la même tête (« huile
    // d'olive », « huile de sésame ») : c'est la suite du texte qui
    // tranche, donc on garde celui qui en consomme le plus.
    const candidats = cibles
      .filter((c) => !vus.has(c.nom) && correspond(brut, c.mots[0]!))
      .map((c) => ({ ...c, ...consommerSuite(texte, depuis, c.mots.slice(1)) }))
      .sort((a, b) => b.consommes - a.consommes)

    const trouve = candidats[0]
    if (!trouve) continue
    // Tête générique que le texte ne qualifie pas : ce n'est pas notre
    // ingrédient qui est cité, c'est le mot courant.
    if (trouve.consommes === 0 && trouve.mots.length > 1 && TETES_GENERIQUES.has(trouve.mots[0]!)) {
      continue
    }

    vus.add(trouve.nom)
    segments.push({ texte: texte.slice(curseur, trouve.fin), quantite: trouve.quantite })
    curseur = trouve.fin
    regex.lastIndex = trouve.fin
  }

  if (curseur < texte.length) segments.push({ texte: texte.slice(curseur) })
  return segments
}
