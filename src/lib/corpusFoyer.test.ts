import assert from 'node:assert/strict'
import { planifierCorpus, recettesVisibles } from './corpusFoyer'
import type { Recipe } from '../types'

const recette = (id: string, extra: Partial<Recipe> = {}): Recipe => ({
  id,
  titre: id,
  temps: 30,
  portions: 2,
  tags: [],
  ingredients: [{ nom: 'x', quantite: 1, unite: 'piece', rayon: 'fruits-legumes' }],
  etapes: ['a'],
  ...extra,
})

// Foyer tout neuf : tout le corpus est à insérer.
{
  const corpus = [recette('a'), recette('b')]
  const plan = planifierCorpus([], corpus)
  assert.deepEqual(plan.aInserer.map((r) => r.id), ['a', 'b'])
  assert.deepEqual(plan.visibles.map((r) => r.id), ['a', 'b'])
}

// Foyer ancien : seule la recette arrivée depuis est ajoutée, après les siennes.
{
  const foyer = [recette('a'), recette('maison')]
  const plan = planifierCorpus(foyer, [recette('a'), recette('aioli')])
  assert.deepEqual(plan.aInserer.map((r) => r.id), ['aioli'])
  assert.deepEqual(plan.visibles.map((r) => r.id), ['a', 'maison', 'aioli'])
}

// Une recette du corpus masquée par le foyer ne revient pas.
{
  const plan = planifierCorpus([recette('a', { masquee: true })], [recette('a')])
  assert.deepEqual(plan.aInserer, [])
  assert.deepEqual(plan.visibles, [])
}

// La photo arrivée après coup complète la copie du foyer, sans toucher au reste.
{
  const foyer = [recette('a', { titre: 'Retouchée' })]
  const plan = planifierCorpus(foyer, [recette('a', { image: '/plats/a.webp' })])
  assert.equal(plan.aCompleter.length, 1)
  assert.equal(plan.visibles[0]!.titre, 'Retouchée')
  assert.equal(plan.visibles[0]!.image, '/plats/a.webp')
}

// Rien à faire quand le foyer est à jour.
{
  const corpus = [recette('a', { image: '/plats/a.webp' })]
  const plan = planifierCorpus(corpus, corpus)
  assert.deepEqual(plan.aInserer, [])
  assert.deepEqual(plan.aCompleter, [])
}

// Doublons d'un semis concurrent : une seule à l'écran, la première.
assert.deepEqual(
  recettesVisibles([recette('a', { titre: '1' }), recette('a', { titre: '2' })]).map((r) => r.titre),
  ['1'],
)
// Une recette visible du même id qu'une masquée reste affichée.
assert.deepEqual(recettesVisibles([recette('a', { masquee: true }), recette('a')]).length, 1)
