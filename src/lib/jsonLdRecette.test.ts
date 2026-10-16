import assert from 'node:assert/strict'
import { dureeIso, extraireRecetteJsonLd } from './jsonLdRecette'
import { analyserIngredient } from './ingredientTexte'
import { extraireUrl } from './importerRecette'

assert.equal(dureeIso('PT1H30M'), 90)
assert.equal(dureeIso('PT45M'), 45)
assert.equal(dureeIso('nope'), 0)

const page = (json: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`

const recette = {
  '@type': 'Recipe',
  name: 'Gratin &amp; cie',
  totalTime: 'PT1H',
  recipeYield: ['4', '4 personnes'],
  recipeIngredient: ['200 g de farine', '2 c. à soupe d&#39;huile'],
  recipeInstructions: [
    { '@type': 'HowToSection', itemListElement: [{ '@type': 'HowToStep', text: 'Mélanger.' }] },
    { '@type': 'HowToStep', text: 'Cuire.' },
  ],
  keywords: 'four, rapide',
}

// Dans un @graph, avec entités HTML et étapes en sections.
const lu = extraireRecetteJsonLd(page({ '@graph': [{ '@type': 'WebSite' }, recette] }))
assert.ok(lu)
assert.equal(lu.titre, 'Gratin & cie')
assert.equal(lu.temps, 60)
assert.equal(lu.portions, 4)
assert.deepEqual(lu.etapes, ['Mélanger.', 'Cuire.'])
assert.deepEqual(lu.ingredients, ['200 g de farine', "2 c. à soupe d'huile"])
assert.deepEqual(lu.tags, ['four', 'rapide'])

// Pas de recette, ou recette incomplète : null.
assert.equal(extraireRecetteJsonLd('<html></html>'), null)
assert.equal(extraireRecetteJsonLd(page({ '@type': 'Recipe', name: 'Vide' })), null)
assert.equal(extraireRecetteJsonLd('<script type="application/ld+json">{oups</script>'), null)

// Ingrédients en phrases libres.
const cas: Array<[string, Partial<ReturnType<typeof analyserIngredient>>]> = [
  ['200 g de farine', { nom: 'farine', quantite: 200, unite: 'g' }],
  ['2 cuillères à soupe d\'huile d\'olive', { nom: "huile d'olive", quantite: 2, unite: 'cs', placard: true }],
  ['1/2 citron', { nom: 'citron', quantite: 0.5, unite: 'piece', rayon: 'fruits-legumes' }],
  ['1 ½ l de lait', { nom: 'lait', quantite: 1.5, unite: 'l', rayon: 'cremerie' }],
  ['3 oignons, émincés', { nom: 'oignons', quantite: 3, unite: 'piece' }],
  ['2 dl de crème', { nom: 'crème', quantite: 200, unite: 'ml' }],
  ['Sel', { nom: 'sel', quantite: 1, unite: 'pincee', placard: true }],
  ['2-3 gousses d\'ail', { quantite: 2, unite: 'piece' }],
  ['500 g de poulet (cuisses)', { nom: 'poulet', quantite: 500, rayon: 'viande-poisson' }],
]
for (const [ligne, attendu] of cas) {
  assert.partialDeepStrictEqual(analyserIngredient(ligne), attendu, ligne)
}

assert.equal(extraireUrl('Regarde ça https://www.marmiton.org/recettes/x.aspx !'), 'https://www.marmiton.org/recettes/x.aspx')
assert.equal(extraireUrl('marmiton.org/recettes/x'), 'https://marmiton.org/recettes/x')
assert.equal(extraireUrl('pas un lien'), null)
