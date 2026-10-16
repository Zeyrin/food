import type { Recipe } from '../types'

/**
 * Le catalogue d'un foyer est une copie du corpus faite le jour de sa
 * création. Sans plus, une recette ajoutée au corpus après coup
 * n'arrivait que dans les foyers créés ensuite : les anciens ne la
 * voyaient jamais. On compare donc, à chaque ouverture, le catalogue du
 * foyer au corpus embarqué, et on complète ce qui manque.
 *
 * Reste à ne pas ressusciter ce que le foyer a supprimé exprès. Une
 * recette du corpus n'est donc plus effacée mais masquée (`masquee`) :
 * la ligne reste, son id compte comme « déjà reçu », et elle ne
 * s'affiche plus. Pas de colonne ni de table en plus : rien à migrer
 * côté Supabase.
 */
export interface PlanCorpus {
  /** Recettes du corpus que le foyer n'a jamais reçues. */
  aInserer: Recipe[]
  /**
   * Recettes du corpus déjà reçues mais sans la photo arrivée depuis.
   * On ne complète que ce champ : le reste a pu être retouché par le
   * foyer, et l'écraser perdrait sa version.
   */
  aCompleter: Recipe[]
  /** Ce que le catalogue doit afficher une fois le plan appliqué. */
  visibles: Recipe[]
}

/**
 * Les recettes à afficher : les masquées en moins, une seule par id.
 * Deux téléphones qui ouvrent le foyer en même temps peuvent insérer la
 * même recette chacun de leur côté ; le doublon reste en base, mais pas
 * à l'écran. La première ligne l'emporte (lecture triée par date).
 */
export function recettesVisibles(lignes: Recipe[]): Recipe[] {
  const vues = new Set<string>()
  const visibles: Recipe[] = []
  for (const r of lignes) {
    if (r.masquee || vues.has(r.id)) continue
    vues.add(r.id)
    visibles.push(r)
  }
  return visibles
}

export function planifierCorpus(lignes: Recipe[], corpus: Recipe[]): PlanCorpus {
  const recues = new Set(lignes.map((r) => r.id))
  const aInserer = corpus.filter((r) => !recues.has(r.id))
  const parId = new Map(corpus.map((r) => [r.id, r]))

  const aCompleter: Recipe[] = []
  const completees = lignes.map((r) => {
    const image = parId.get(r.id)?.image
    if (r.masquee || r.image || !image) return r
    const complete = { ...r, image }
    aCompleter.push(complete)
    return complete
  })

  return { aInserer, aCompleter, visibles: recettesVisibles([...completees, ...aInserer]) }
}
