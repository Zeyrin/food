import assert from 'node:assert/strict'
import corpus from '../data/recipes.json'
import { ajouteeParLeFoyer, estFavorite, favoris } from './favoris'
import type { Historique } from './propose'
import type { Recipe } from '../types'

const recette = (id: string): Recipe => ({
  id,
  titre: id,
  temps: 30,
  portions: 2,
  tags: [],
  ingredients: [{ nom: 'x', quantite: 1, unite: 'piece', magasin: 'primeur' }],
  etapes: ['a'],
})

const duCorpus = recette((corpus as Recipe[])[0]!.id)
const maison = recette('recette-collee-par-le-foyer')
const VIDE: Historique = { derniereFois: {}, verdicts: {} }

// Une recette du corpus n'est pas une recette du foyer, et l'inverse.
assert.ok(!ajouteeParLeFoyer(duCorpus))
assert.ok(ajouteeParLeFoyer(maison))

// Les deux portes d'entrée de la catégorie : le verdict après cuisson…
assert.ok(!estFavorite(duCorpus, VIDE))
assert.ok(estFavorite(duCorpus, { derniereFois: {}, verdicts: { [duCorpus.id]: 'refaire' } }))
// …et le fait d'avoir écrit la recette, sans l'avoir encore cuisinée.
assert.ok(estFavorite(maison, VIDE))

// « Jamais » l'emporte sur les deux : une recette maison écartée après
// cuisson sort de la catégorie.
assert.ok(!estFavorite(maison, { derniereFois: {}, verdicts: { [maison.id]: 'jamais' } }))
assert.ok(!estFavorite(duCorpus, { derniereFois: {}, verdicts: { [duCorpus.id]: 'jamais' } }))

// La catégorie réunit bien les deux origines, sans doublon ni réordonnancement.
const autreCorpus = recette((corpus as Recipe[])[1]!.id)
const liste = favoris([duCorpus, autreCorpus, maison], {
  derniereFois: {},
  verdicts: { [duCorpus.id]: 'refaire' },
})
assert.deepEqual(liste.map((r) => r.id), [duCorpus.id, maison.id])

console.log('ok')
