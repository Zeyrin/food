import assert from 'node:assert/strict'
import corpus from '../data/recipes.json'
import type { Recipe } from '../types'
import { emojiIngredient } from './emojiIngredient'

// Les motifs les plus précis passent avant les plus larges.
assert.equal(emojiIngredient('tomate cerise', 'fruits-legumes'), '🍅')
assert.equal(emojiIngredient('pomme de terre', 'fruits-legumes'), '🥔')
assert.equal(emojiIngredient('pomme', 'fruits-legumes'), '🍏')
assert.equal(emojiIngredient('lait de coco', 'epicerie'), '🥥')
assert.equal(emojiIngredient('lait', 'cremerie'), '🥛')
assert.equal(emojiIngredient('huile de sésame', 'epicerie'), '🫗')
assert.equal(emojiIngredient('vinaigre de riz', 'epicerie'), '🥫')
assert.equal(emojiIngredient('vin rouge', 'boissons'), '🍷')
assert.equal(emojiIngredient('ail', 'fruits-legumes'), '🧄')
assert.equal(emojiIngredient('citronnelle', 'fruits-legumes'), '🌿')

// Un nom inconnu retombe sur son rayon, jamais sur un blanc.
assert.equal(emojiIngredient('papier toilette', 'autre'), '🛒')
for (const r of corpus as Recipe[]) {
  for (const i of r.ingredients) assert.ok(emojiIngredient(i.nom, i.rayon).length > 0, i.nom)
}
