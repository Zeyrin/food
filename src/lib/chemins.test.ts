import assert from 'node:assert/strict'
import { chemin, normaliserChemin, pileDepuisChemin, type Vue } from './chemins'
import type { Recipe } from '../types'

const RECETTE: Recipe = {
  id: 'r-42',
  titre: 'Dahl de lentilles',
  temps: 30,
  portions: 2,
  tags: [],
  ingredients: [],
  etapes: [],
}

// --- Une adresse par écran ------------------------------------------------

assert.equal(chemin({ type: 'onglet', onglet: 'propose' }), '#/')
assert.equal(chemin({ type: 'onglet', onglet: 'panier' }), '#/panier')
assert.equal(chemin({ type: 'onglet', onglet: 'liste' }), '#/liste')
assert.equal(chemin({ type: 'onglet', onglet: 'cuisson' }), '#/cuisson')
assert.equal(chemin({ type: 'reglages' }), '#/reglages')
assert.equal(chemin({ type: 'detail', recipeId: 'r-42' }), '#/recette/r-42')
assert.equal(chemin({ type: 'cuisson', recipeId: 'r-42' }), '#/cuisson/r-42')
assert.equal(chemin({ type: 'edition', recette: RECETTE }), '#/recette/r-42/modifier')

// Deux écrans différents n'ont jamais la même adresse : sans ça, le
// rapport de pages les recompte ensemble — le défaut qu'on corrige.
const VUES: Vue[] = [
  { type: 'onglet', onglet: 'propose' },
  { type: 'onglet', onglet: 'panier' },
  { type: 'onglet', onglet: 'liste' },
  { type: 'onglet', onglet: 'cuisson' },
  { type: 'reglages' },
  { type: 'detail', recipeId: 'r-42' },
  { type: 'cuisson', recipeId: 'r-42' },
  { type: 'edition', recette: RECETTE },
]
assert.equal(new Set(VUES.map(chemin)).size, VUES.length)

// --- L'accueil s'écrit de trois façons ------------------------------------

assert.equal(normaliserChemin(''), '#/')
assert.equal(normaliserChemin('#'), '#/')
assert.equal(normaliserChemin('#/'), '#/')
// Une première visite arrive sans fragment du tout : l'app ne doit pas
// réécrire l'URL pour ça (une réécriture = une page vue de plus).
assert.equal(normaliserChemin(''), chemin({ type: 'onglet', onglet: 'propose' }))

// --- Retrouver l'écran depuis l'URL ---------------------------------------

assert.deepEqual(pileDepuisChemin(''), [{ type: 'onglet', onglet: 'propose' }])
assert.deepEqual(pileDepuisChemin('#/panier'), [{ type: 'onglet', onglet: 'panier' }])

// Un sous-écran ouvert par un lien garde le catalogue dessous : sinon
// « précédent » quitte le site au lieu de reculer d'un écran.
assert.deepEqual(pileDepuisChemin('#/reglages'), [
  { type: 'onglet', onglet: 'propose' },
  { type: 'reglages' },
])
assert.deepEqual(pileDepuisChemin('#/recette/r-42'), [
  { type: 'onglet', onglet: 'propose' },
  { type: 'detail', recipeId: 'r-42' },
])
// Le plat à cuisiner repart, lui, de l'onglet où on l'aurait trouvé.
assert.deepEqual(pileDepuisChemin('#/cuisson/r-42'), [
  { type: 'onglet', onglet: 'cuisson' },
  { type: 'cuisson', recipeId: 'r-42' },
])

// L'édition tient une recette entière, pas un identifiant : elle ne se
// reconstruit pas de mémoire, on rend la fiche d'où « Modifier » part.
assert.deepEqual(pileDepuisChemin('#/recette/r-42/modifier'), [
  { type: 'onglet', onglet: 'propose' },
  { type: 'detail', recipeId: 'r-42' },
])

// Chaque écran reconstruit rend bien l'écran demandé, en haut de pile.
for (const vue of VUES) {
  if (vue.type === 'edition') continue
  const pile = pileDepuisChemin(chemin(vue))
  assert.ok(pile, `pile introuvable pour ${chemin(vue)}`)
  assert.deepEqual(pile[pile.length - 1], vue)
}

// --- Ce qui ne veut rien dire ne casse rien -------------------------------

assert.equal(pileDepuisChemin('#/nimportequoi'), null)
assert.equal(pileDepuisChemin('#/recette'), null)
assert.equal(pileDepuisChemin('#/recette/r-42/autre-chose'), null)
assert.equal(pileDepuisChemin('#/panier/r-42'), null)
// Un fragment d'ancre ordinaire n'est pas une route.
assert.equal(pileDepuisChemin('#section-2'), null)
