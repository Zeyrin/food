import assert from 'node:assert/strict'
import { motsRecherche, normaliserTexte } from './texte'
import { buildList } from './aggregate'
import type { Recipe } from '../types'

assert.equal(normaliserTexte('Œufs'), 'oeufs')
assert.equal(normaliserTexte('  Crème   fraîche '), 'creme fraiche')
assert.equal(normaliserTexte('œuf').includes(normaliserTexte('oeuf')), true)
assert.deepEqual(motsRecherche('Poulet,  curry'), ['poulet', 'curry'])

// « Oeufs » d'une recette maison et « œuf » du catalogue : une seule ligne.
const r = (id: string, nom: string): Recipe => ({
  id,
  titre: id,
  temps: 10,
  portions: 2,
  tags: [],
  etapes: ['x'],
  ingredients: [{ nom, quantite: 2, unite: 'piece', rayon: 'cremerie' }],
})
const liste = buildList(
  [
    { recipeId: 'a', portions: 2 },
    { recipeId: 'b', portions: 2 },
  ],
  [r('a', 'œuf'), r('b', 'Oeufs')],
)
assert.equal(liste.length, 1)
assert.equal(liste[0]!.quantite, 4)
