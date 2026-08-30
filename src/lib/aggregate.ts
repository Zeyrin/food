import type { BasketEntry, ListItem, Recipe, Unit } from '../types'
import { RAYONS } from '../types'
import { traduire } from './i18n'
import { rayonDe } from './rayons'

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
          rayon: rayonDe(ing),
          origines: [recipe.titre],
        })
      }
    }
  }

  return [...acc.values()]
    .map((item) => ({ ...item, quantite: arrondir(item.quantite, item.unite) }))
    .sort((a, b) => RAYONS[a.rayon].order - RAYONS[b.rayon].order || a.nom.localeCompare(b.nom, 'fr'))
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

/**
 * Suffixes lisibles. Les unités qui s'accordent reçoivent leur vraie
 * forme plutôt qu'un « (s) » : « 1 botte », « 2 bottes ».
 *
 * Ils passent par le dictionnaire depuis qu'il y a deux langues : les
 * unités métriques (g, ml…) s'écrivent pareil partout et restent
 * telles quelles, mais « c. à s. » et « pincée » n'ont rien d'anglais.
 * `traduire` lit la langue courante de l'app hors de React — cette
 * fonction est appelée depuis quatre écrans et n'est pas un composant
 * (voir lib/i18n.tsx).
 */
const AFFICHAGE: Partial<Record<Unit, (n: number) => string>> = {
  piece: () => '',
  pincee: (n) => traduire(n > 1 ? 'unites.pincees' : 'unites.pincee'),
  botte: (n) => traduire(n > 1 ? 'unites.bottes' : 'unites.botte'),
  cs: () => traduire('unites.cs'),
  cc: () => traduire('unites.cc'),
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }

/**
 * « 0.5 c. à c. » ne se lit pas : en cuisine on écrit ½. Le reste passe
 * au séparateur décimal de la langue affichée — virgule en français,
 * point en anglais.
 */
function formatNombre(n: number): string {
  const entier = Math.floor(n)
  const fraction = FRACTIONS[String(+(n - entier).toFixed(2))]
  if (fraction) return entier > 0 ? `${entier}${fraction}` : fraction
  return String(n).replace('.', traduire('unites.separateurDecimal'))
}

export function formatQuantite(item: Pick<ListItem, 'quantite' | 'unite'>): string {
  const suffixe = AFFICHAGE[item.unite]?.(item.quantite) ?? item.unite
  return `${formatNombre(item.quantite)} ${suffixe}`.trim()
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

/**
 * Un morceau d'étape découpé par `annoterEtape`. `ing` est l'ingrédient
 * que ce morceau cite — le mode cuisson sort les doses du texte pour les
 * poser sur une ligne au-dessus, et il lui faut l'ingrédient lui-même,
 * pas seulement sa dose formatée : c'est son nom qui sert de clé pour
 * l'afficher dans la langue de l'app.
 */
export interface Segment {
  texte: string
  quantite?: string
  ing?: IngredientCite
}

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
 * Ce qui se dit d'un ingrédient juste après l'avoir nommé, et qui
 * appartient encore au groupe : « les feuilles de combava froissées »
 * se lit d'un bloc. La dose posée avant le participe coupait la phrase
 * en deux — « les feuilles de combava 3 froissées ». Liste fermée et
 * volontairement courte : un mot qui n'y est pas ne fait rien de pire
 * que l'ancien comportement.
 *
 * Les quatre accords sont dépliés au chargement depuis le radical :
 * « froiss » couvre froissé, froissée, froissés et froissées.
 */
const RADICAUX_ES = [
  'froiss', 'ecras', 'hach', 'cisel', 'eminc', 'coup', 'rap', 'pel', 'denoyaut', 'egoutt',
  'rinc', 'concass', 'effeuill', 'equeut', 'emiett', 'essor', 'epluch', 'lav', 'tranch',
  'detaill', 'grill', 'torrefi', 'dilu', 'delay', 'reserv',
]

/** Ceux dont le masculin singulier ne finit pas en `é` : « fondu »,
 *  « cuit », « entier » s'accordent sans radical à reconstituer. */
const MOTS_ACCORDES = ['fondu', 'moulu', 'battu', 'cuit', 'cru', 'entier', 'blanchi', 'revenu']

const QUALIFICATIFS = new Set([
  ...RADICAUX_ES.flatMap((r) => ['e', 'es', 'ee', 'ees'].map((f) => r + f)),
  ...MOTS_ACCORDES.flatMap((m) => ['', 'e', 's', 'es'].map((f) => m + f)),
])

/** Les adverbes qui suivent ces participes (« hachés finement ») et la
 *  découpe qui les complète (« coupées en dés »). */
const ADVERBES = new Set(['finement', 'grossierement', 'legerement', 'prealablement'])
const DECOUPES = new Set([
  'des', 'rondelles', 'lamelles', 'morceaux', 'quartiers', 'cubes', 'batonnets',
  'julienne', 'tranches', 'deux', 'quatre',
])

/**
 * Prolonge la fin d'une mention jusqu'au bout de ce qui la qualifie
 * encore. S'arrête à la première ponctuation : « les feuilles de combava
 * froissées, le nuoc mam » n'avale pas la suite de l'énumération.
 */
function consommerQualificatifs(texte: string, depuis: number): number {
  const suite = /[\p{L}\p{M}]+/gu
  suite.lastIndex = depuis
  let fin = depuis
  let bord = depuis
  let prochain: RegExpExecArray | null

  while ((prochain = suite.exec(texte)) !== null) {
    if (!/^[\s'\u2019-]*$/.test(texte.slice(bord, prochain.index))) break
    const mot = sansAccents(prochain[0])
    const suivant = prochain.index + prochain[0].length
    if (QUALIFICATIFS.has(mot) || ADVERBES.has(mot)) {
      fin = suivant
    } else if (fin > depuis && (mot === 'en' || DECOUPES.has(mot))) {
      // « coupées en dés » : la découpe complète le participe, elle ne
      // s'attrape jamais seule.
      fin = suivant
    } else {
      break
    }
    bord = suivant
  }

  return fin
}

/**
 * Une mention partielle ne prend pas la dose entière. « Verser le reste
 * du lait de coco » suivi de « 80 cl » se lit comme un ordre de verser
 * les 80 cl — alors qu'on en a déjà mis la moitié à l'étape d'avant.
 * Sans dose, la phrase reste juste : la quantité totale est dans le
 * tiroir des ingrédients, à un doigt de là.
 */
const MENTION_PARTIELLE =
  /\b(reste|restes|moitie|moities|tiers|quart|quarts|peu|partie|parties|bout|morceau|morceaux|cuillere|cuillerees?|louche|louches|filet|filets|pincee|pincees|poignee|poignees)\s+(?:de\s+la|de\s+l|du|des|de|d)['\u2019\s]*$/

const estMentionPartielle = (texte: string, debut: number) =>
  MENTION_PARTIELLE.test(sansAccents(texte.slice(0, debut)))

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
function annoterMarqueurs(texte: string, ingredients: IngredientCite[]): Segment[] {
  const segments: Segment[] = []
  let curseur = 0

  for (const m of texte.matchAll(MARQUEURS)) {
    const libelle = m[1]!
    const debut = m.index ?? 0
    const ing = ingredientDesigne(libelle, ingredients)
    const partielle = estMentionPartielle(texte, debut)
    segments.push({
      texte: texte.slice(curseur, debut) + libelle,
      ...(ing && !partielle && !quantiteMuette(ing) ? { quantite: formatQuantite(ing), ing } : {}),
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
 * Singulier et pluriel sont acceptés.
 *
 * Les mots de moins de 3 lettres sont ignorés. Le seuil était à 4 tant
 * que la dose s'écrivait au milieu de la phrase : « ail », « riz » et
 * « œuf » reviennent à chaque étape, et une phrase hachée par les
 * quantités devenait illisible. Les doses vivent maintenant sur leur
 * propre ligne au-dessus de l'étape, une par ingrédient : « 60 g ail »
 * y a toute sa place, et c'est même la première chose qu'on venait
 * chercher.
 */
export function annoterEtape(texte: string, ingredients: IngredientCite[]): Segment[] {
  if (MARQUEUR.test(texte)) return annoterMarqueurs(texte, ingredients)

  const cibles = ingredients
    // Le placard est exclu de la reconnaissance : « poivrer avec le
    // poivre ½ c. à c. » n'aide personne. Un marqueur explicite, lui,
    // reste honoré — c'est l'auteur qui décide.
    .filter((ing) => !ing.placard && !quantiteMuette(ing))
    .map((ing) => ({ ing, nom: ing.nom, mots: motsDuNom(ing.nom), quantite: formatQuantite(ing) }))
    .filter((c) => (c.mots[0]?.length ?? 0) >= 3)

  if (cibles.length === 0) return [{ texte }]

  // Un seul passage sur le texte, chaque ingrédient annoté une fois.
  const segments: Segment[] = []
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

    // Mention partielle : on la reconnaît — donc on ne la réannotera pas
    // plus loin dans l'étape — mais sans y accrocher la dose entière.
    if (estMentionPartielle(texte, m.index)) {
      vus.add(trouve.nom)
      regex.lastIndex = trouve.fin
      continue
    }

    const fin = consommerQualificatifs(texte, trouve.fin)
    vus.add(trouve.nom)
    segments.push({ texte: texte.slice(curseur, fin), quantite: trouve.quantite, ing: trouve.ing })
    curseur = fin
    regex.lastIndex = fin
  }

  if (curseur < texte.length) segments.push({ texte: texte.slice(curseur) })
  return segments
}

/**
 * Les ingrédients qu'une étape met en jeu, avec leur dose, dans l'ordre
 * où l'étape les nomme.
 *
 * Le mode cuisson ne colle plus la dose au milieu de la phrase : « faire
 * revenir l'ail 60 g dans la poêle » se lit deux fois, une fois pour la
 * consigne et une fois pour le nombre. Les doses montent donc sur une
 * ligne à part, au-dessus de l'étape — « 60 g ail » — et la phrase
 * redevient une phrase : « faire revenir l'ail dans la poêle ».
 *
 * La reconnaissance tourne toujours sur le texte français du corpus,
 * même quand l'app affiche l'anglais : c'est lui qui porte les
 * marqueurs et la morphologie que `annoterEtape` sait lire. Seul
 * l'affichage du nom change de langue, et il se fait par la clé
 * canonique portée ici.
 */
export function dosesDeLEtape(texte: string, ingredients: IngredientCite[]): IngredientCite[] {
  const vus = new Set<string>()
  const doses: IngredientCite[] = []
  for (const seg of annoterEtape(texte, ingredients)) {
    if (!seg.ing || vus.has(seg.ing.nom)) continue
    vus.add(seg.ing.nom)
    doses.push(seg.ing)
  }
  return doses
}
