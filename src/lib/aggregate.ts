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

const AFFICHAGE: Partial<Record<Unit, string>> = {
  piece: '',
  pincee: ' pincée(s)',
  botte: ' botte(s)',
  cs: ' c. à s.',
  cc: ' c. à c.',
}

export function formatQuantite(item: Pick<ListItem, 'quantite' | 'unite'>): string {
  const suffixe = AFFICHAGE[item.unite] ?? ` ${item.unite}`
  return `${item.quantite}${suffixe}`.trim()
}

const sansAccents = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Repère les ingrédients cités dans le texte d'une étape et découpe
 * celui-ci en segments, en annotant chaque mention de sa quantité.
 *
 * On matche sur le premier mot assez long du nom ("pâtes" pour « pâtes
 * longues ») : c'est le nom, ce qui suit n'est qu'un qualificatif que
 * la recette omet — elle écrit « cuire les pâtes ». Singulier et
 * pluriel sont acceptés. Les mots courts sont ignorés, « ail » ou
 * « sel » se retrouvent partout et annoter chaque occurrence rendrait
 * l'étape illisible.
 */
export function annoterEtape(
  texte: string,
  ingredients: Array<Pick<ListItem, 'nom' | 'quantite' | 'unite'>>,
): Array<{ texte: string; quantite?: string }> {
  const mots = ingredients
    .map((ing) => {
      const [mot, motSuivant] = sansAccents(ing.nom)
        .split(/\s+/)
        .filter((m) => m.length >= 4)
      return mot ? { mot, motSuivant, quantite: formatQuantite(ing) } : null
    })
    .filter((x): x is { mot: string; motSuivant: string | undefined; quantite: string } => x !== null)

  if (mots.length === 0) return [{ texte }]

  const pluriels = (mot: string) => (/(?:eau|eu)$/.test(mot) ? [mot + 'x'] : [mot + 's'])
  const correspond = (brut: string, cible: string) =>
    brut === cible || pluriels(cible).includes(brut) || pluriels(brut).includes(cible)

  // Un seul passage sur le texte : on avance mot à mot, la première
  // correspondance gagne et n'est annotée qu'une fois par étape.
  const segments: Array<{ texte: string; quantite?: string }> = []
  const vus = new Set<string>()
  const regex = /[\p{L}\p{M}]+/gu
  let curseur = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(texte)) !== null) {
    const brut = sansAccents(m[0])
    const trouve = mots.find((x) => !vus.has(x.mot) && correspond(brut, x.mot))
    if (!trouve) continue

    vus.add(trouve.mot)

    // Nom composé ("oignon nouveau") : si le mot qui suit dans le
    // texte correspond au qualificatif, on annote après lui plutôt
    // qu'au milieu du groupe nominal.
    let fin = m.index + m[0].length
    if (trouve.motSuivant) {
      const suite = /[\p{L}\p{M}]+/gu
      suite.lastIndex = fin
      const prochain = suite.exec(texte)
      if (prochain && texte.slice(fin, prochain.index).trim() === '') {
        const brutSuivant = sansAccents(prochain[0])
        if (correspond(brutSuivant, trouve.motSuivant)) fin = prochain.index + prochain[0].length
      }
    }
    segments.push({ texte: texte.slice(curseur, fin), quantite: trouve.quantite })
    curseur = fin
    regex.lastIndex = fin
  }

  if (curseur < texte.length) segments.push({ texte: texte.slice(curseur) })
  return segments
}
