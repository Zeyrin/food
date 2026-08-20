import assert from 'node:assert/strict'
import { proposer, type Historique } from './propose'
import type { Recipe } from '../types'

const recette = (id: string, temps = 30, tags: string[] = []): Recipe => ({
  id,
  titre: id,
  temps,
  portions: 2,
  tags,
  ingredients: [{ nom: 'x', quantite: 1, unite: 'piece', magasin: 'primeur' }],
  etapes: ['a'],
})

const CORPUS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => recette(id))
const VIDE: Historique = { derniereFois: {}, verdicts: {} }
const ids = (r: Recipe[]) => r.map((x) => x.id).join(',')

// Le classement doit être stable d'un appel à l'autre : l'écran est
// remonté à chaque passage d'onglet, et une grille qui se rebat sous les
// doigts fait perdre la recette qu'on venait de repérer.
const premier = ids(proposer(CORPUS, VIDE, { nombre: CORPUS.length }))
for (let i = 0; i < 20; i++) {
  assert.equal(ids(proposer(CORPUS, VIDE, { nombre: CORPUS.length })), premier)
}

// …mais il reste un classement, pas l'ordre du catalogue.
assert.notEqual(premier, ids(CORPUS))

// Les recettes écartées ne reviennent pas, les filtres filtrent.
const rejete: Historique = { derniereFois: {}, verdicts: { c: 'jamais' } }
assert.ok(!ids(proposer(CORPUS, rejete, { nombre: 99 })).split(',').includes('c'))
assert.equal(proposer([recette('lent', 60), recette('vif', 15)], VIDE, { tempsMax: 20 }).length, 1)

// Un plat cuisiné hier descend derrière le même plat jamais cuisiné.
const hier: Historique = { derniereFois: { a: Date.now() - 86_400_000 }, verdicts: {} }
const classe = ids(proposer(CORPUS, hier, { nombre: CORPUS.length })).split(',')
assert.ok(classe.indexOf('a') > classe.indexOf('b'))

console.log('ok')
