import assert from 'node:assert/strict'
import type { Recipe } from '../types'
import { nomIngredient, nomTag, recetteAffichee } from './traduireRecette'
import { dosesDeLEtape } from './aggregate'

const mapo: Recipe = JSON.parse(
  JSON.stringify(
    (
      (await import('../data/recipes.json', { with: { type: 'json' } })).default as Recipe[]
    ).find((r) => r.id === 'mapo-tofu'),
  ),
)

// Le corpus reste la référence : en français, rien ne bouge.
assert.equal(recetteAffichee(mapo, 'fr').titre, 'Mapo tofu')
assert.equal(recetteAffichee(mapo, 'fr').ingredients[0]!.affichage, 'tofu soyeux')
assert.equal(recetteAffichee(mapo, 'fr').etapes[1], mapo.etapes[1])

// En anglais, le texte change mais pas les clés.
const en = recetteAffichee(mapo, 'en')
assert.equal(en.ingredients[0]!.nom, 'tofu soyeux', "la clé d'agrégation ne doit pas être traduite")
assert.equal(en.ingredients[0]!.affichage, 'silken tofu')
assert.equal(en.etapes.length, mapo.etapes.length)
assert.ok(en.etapes[1]!.startsWith('Chop the garlic'), en.etapes[1]!)
assert.ok(en.tags.includes('spicy'), en.tags.join(', '))

// Une recette collée par l'utilisateur n'a aucune traduction : elle
// s'affiche telle qu'elle a été écrite plutôt que de perdre ses étapes.
const perso: Recipe = {
  id: 'perso-1',
  titre: 'Tarte aux poires',
  temps: 40,
  portions: 4,
  tags: ['inventé'],
  ingredients: [{ nom: 'poire', quantite: 4, unite: 'piece', rayon: 'fruits-legumes' }],
  etapes: ['Éplucher les poires.'],
}
const persoEn = recetteAffichee(perso, 'en')
assert.equal(persoEn.titre, 'Tarte aux poires')
assert.deepEqual(persoEn.etapes, perso.etapes)
assert.equal(persoEn.ingredients[0]!.affichage, 'poire')
assert.deepEqual(persoEn.tags, ['inventé'])

assert.equal(nomIngredient('ail', 'en'), 'garlic')
assert.equal(nomIngredient('ail', 'fr'), 'ail')
assert.equal(nomIngredient('sarrasin torréfié', 'en'), 'sarrasin torréfié')
assert.equal(nomTag('végé', 'en'), 'veggie')

/**
 * Les doses se lisent sur le texte français — c'est lui qui porte la
 * morphologie que sait suivre `annoterEtape` — et l'écran les
 * réétiquette ensuite avec le nom affiché. Le contrat vérifié ici est
 * que la reconnaissance rende bien l'ingrédient, pas seulement sa dose.
 */
const doses = dosesDeLEtape(mapo.etapes[1]!, mapo.ingredients)
assert.deepEqual(
  doses.map((d) => d.nom),
  ['ail', 'gingembre frais', 'oignon nouveau'],
  mapo.etapes[1]!,
)
assert.deepEqual(
  doses.map((d) => nomIngredient(d.nom, 'en')),
  ['garlic', 'fresh ginger', 'spring onion'],
)

// Un ingrédient cité deux fois dans la même étape ne donne qu'une dose.
assert.deepEqual(
  dosesDeLEtape('Couper les tomates, saler les tomates.', [
    { nom: 'tomate', quantite: 4, unite: 'piece' },
  ]).map((d) => d.nom),
  ['tomate'],
)
