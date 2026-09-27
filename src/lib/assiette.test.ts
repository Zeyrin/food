import { test } from 'node:test'
import assert from 'node:assert/strict'
import corpus from '../data/recipes.json'
import type { Recipe } from '../types'
import { composerAssiette } from './assiette'

const recettes = corpus as Recipe[]

test("une recette garde la même assiette d'un rendu à l'autre", () => {
  for (const r of recettes.slice(0, 20)) {
    assert.deepEqual(composerAssiette(r.titre, r.ingredients), composerAssiette(r.titre, r.ingredients))
  }
})

test('aucune recette du corpus ne sort une assiette vide', () => {
  for (const r of recettes) {
    assert.ok(composerAssiette(r.titre, r.ingredients).length > 0, r.titre)
  }
})

test("une recette sans ingrédient reconnu reçoit quand même une base", () => {
  assert.ok(composerAssiette('Mystère', []).length > 0)
  assert.ok(composerAssiette('Mystère', [{ nom: 'sel', quantite: 1, unite: 'pincee', rayon: 'epicerie' }]).length > 0)
})

test('les assiettes tiennent dans leur repère', () => {
  for (const r of recettes) {
    for (const e of composerAssiette(r.titre, r.ingredients)) {
      if (e.type === 'rond' || e.type === 'tranche' || e.type === 'feuille') {
        assert.ok(Math.hypot(e.cx - 50, e.cy - 50) < 34, `${r.titre} déborde`)
      }
    }
  }
})
