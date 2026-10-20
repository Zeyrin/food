import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ajouterMenu, lienMenu, lireMenu } from './menuPartage'

test('lit les plats, les parts et le prénom du fragment', () => {
  assert.deepEqual(lireMenu('#/m/mapo-tofu:2,curry-pois-chiches:4?de=Camille'), {
    plats: [
      { recipeId: 'mapo-tofu', portions: 2 },
      { recipeId: 'curry-pois-chiches', portions: 4 },
    ],
    de: 'Camille',
  })
})

test('des parts absentes ou absurdes retombent sur une valeur sûre', () => {
  assert.deepEqual(lireMenu('#/m/mapo-tofu,dahl:0,ragout:999')?.plats, [
    { recipeId: 'mapo-tofu', portions: 2 },
    { recipeId: 'dahl', portions: 2 },
    { recipeId: 'ragout', portions: 50 },
  ])
})

test('ignore les doublons, les morceaux illisibles et le trop-plein', () => {
  assert.deepEqual(lireMenu('#/m/Mapo-Tofu:2,mapo-tofu:3,<script>,,dahl')?.plats, [
    { recipeId: 'mapo-tofu', portions: 2 },
    { recipeId: 'dahl', portions: 2 },
  ])
  const trop = Array.from({ length: 30 }, (_, i) => `plat-${i}`).join(',')
  assert.equal(lireMenu(`#/m/${trop}`)?.plats.length, 21)
})

test("ignore ce qui n'est pas un menu", () => {
  assert.equal(lireMenu(''), null)
  assert.equal(lireMenu('#/m/'), null)
  assert.equal(lireMenu('#/r/mapo-tofu'), null)
  assert.equal(lireMenu('#/f/0b3f6d2e-8c1a-4f7e-9d2b-5a6c7e8f9a0b'), null)
})

test('le lien rouvre le même menu', () => {
  const plats = [
    { recipeId: 'mapo-tofu', portions: 2 },
    { recipeId: 'dahl', portions: 6 },
  ]
  const lien = lienMenu(plats, '  Zoé & Léa ', 'https://www.fffood.fr')
  assert.equal(lien.startsWith('https://www.fffood.fr/menu/#/m/mapo-tofu:2,dahl:6?de='), true)
  assert.deepEqual(lireMenu(new URL(lien).hash), { plats, de: 'Zoé & Léa' })
  assert.equal(lienMenu(plats, '', 'https://www.fffood.fr'), 'https://www.fffood.fr/menu/#/m/mapo-tofu:2,dahl:6')
})

test("le menu s'ajoute au panier sans rien en retirer", () => {
  const panier = [{ recipeId: 'dahl', portions: 4 }]
  const recu = [
    { recipeId: 'mapo-tofu', portions: 2 },
    { recipeId: 'dahl', portions: 6 },
  ]
  assert.deepEqual(ajouterMenu(panier, recu), [
    { recipeId: 'dahl', portions: 4 },
    { recipeId: 'mapo-tofu', portions: 2 },
  ])
})
