import assert from 'node:assert/strict'
import corpus from '../data/recipes.json'
import { formatDuree, minuteursDeLEtape } from './duree'

const secondes = (texte: string) => minuteursDeLEtape(texte).map((m) => m.secondes)
const noms = (texte: string) => minuteursDeLEtape(texte).map((m) => m.nom)

assert.deepEqual(secondes('Laisser mijoter 20 min à couvert.'), [1200])
assert.deepEqual(secondes('Réchauffer 20 secondes à la poêle.'), [20])
assert.deepEqual(secondes('Laisser reposer 1 h.'), [3600])
assert.deepEqual(secondes('Cuire 10 minutes puis 5 min de plus.'), [300, 600])

// Une durée citée deux fois ne donne qu'un minuteur.
assert.deepEqual(secondes('4 min de chaque côté, 4 min au total.'), [240])

// Ce qui n'est pas une durée n'en devient pas une.
assert.deepEqual(secondes('Préchauffer le four à 200 °C.'), [])
assert.deepEqual(secondes('Couper en cubes de 2 cm.'), [])
assert.deepEqual(secondes("Verser 150 ml d'eau."), [])
assert.deepEqual(secondes('Mélanger avec 3 cs de tahini.'), [])

// Le nom dit à quoi sert le minuteur.
assert.deepEqual(noms('Faire dorer les lardons à sec 4 min.'), ['Faire dorer les lardons à sec'])
assert.deepEqual(noms('Chauffer un wok à feu vif, saisir ail et gingembre 30 secondes.'), [
  'Saisir ail et gingembre',
])

// Un dernier morceau trop court reprend celui d'avant.
assert.deepEqual(noms('Ajouter les pois chiches égouttés, laisser 5 min de plus.'), [
  'Ajouter les pois chiches égouttés, laisser',
])

// Les amorces sautent, les marqueurs d'ingrédient ne s'affichent pas.
assert.deepEqual(noms('Émincer l\'oignon. Puis faire revenir les {lardons fumés} 5 min.'), [
  'Faire revenir les lardons fumés',
])

// Sans rien devant la durée, un nom de repli plutôt qu'un vide.
assert.deepEqual(noms('20 min au four.'), ['Minuteur 20 min'])

assert.equal(formatDuree(1200), '20 min')
assert.equal(formatDuree(30), '30 s')
assert.equal(formatDuree(3600), '1 h')

// Aucune étape du corpus ne doit produire de minuteur aberrant : une
// durée de cuisine tient entre dix secondes et trois heures, et un nom
// vide serait illisible dans le panneau.
for (const r of corpus as Array<{ id: string; etapes: string[] }>) {
  for (const etape of r.etapes) {
    for (const m of minuteursDeLEtape(etape)) {
      assert.ok(
        m.secondes >= 10 && m.secondes <= 10800,
        `${r.id} : durée douteuse (${m.secondes} s) dans « ${etape} »`,
      )
      assert.ok(m.nom.length >= 3, `${r.id} : minuteur sans nom dans « ${etape} »`)
    }
  }
}

console.log('ok')
