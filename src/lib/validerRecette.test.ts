import assert from 'node:assert/strict'
import { validerRecette } from './validerRecette'

const base = {
  titre: 'Test',
  temps: 20,
  portions: 2,
  tags: [],
  etapes: ['Faire.'],
  ingredients: [{ nom: 'riz', quantite: 200, unite: 'g', rayon: 'epicerie' }],
}

const ok = (json: unknown) => {
  const r = validerRecette(json)
  assert.ok('recette' in r, `attendu valide, reçu : ${JSON.stringify(r)}`)
  return r.recette
}
const ko = (json: unknown) => {
  const r = validerRecette(json)
  assert.ok('erreurs' in r, 'attendu invalide')
  return r.erreurs
}

// Une recette minimale passe, sans photo.
assert.equal(ok(base).image, undefined)

// Photo livrée avec le build : acceptée telle quelle.
assert.equal(ok({ ...base, image: '/plats/mapo-tofu.webp' }).image, '/plats/mapo-tofu.webp')

// Tout ce qui sort de /plats est refusé — et le dit, plutôt que de
// disparaître en silence et de passer pour un bug d'affichage.
for (const image of [
  'https://exemple.fr/photo.jpg',
  '//exemple.fr/photo.webp',
  '/plats/../../secret.webp',
  '/plats/photo.jpg',
  'plats/photo.webp',
]) {
  const erreurs = ko({ ...base, image })
  assert.ok(
    erreurs.some((e) => e.includes('image')),
    `« ${image} » aurait dû être refusée avec un message sur « image »`,
  )
}

// Un rayon inconnu est refusé.
assert.ok(
  ko({ ...base, ingredients: [{ ...base.ingredients[0], rayon: 'cave-a-vin' }] }).some((e) =>
    e.includes('rayon'),
  ),
)

// Mais une recette écrite avant les rayons, qui nomme encore un magasin,
// entre quand même : elle est traduite plutôt que refusée.
const ancienne = ok({
  ...base,
  ingredients: [{ nom: 'riz', quantite: 200, unite: 'g', magasin: 'intermarche' }],
})
assert.ok(ancienne.ingredients[0]!.rayon, 'un magasin d\'avant doit se traduire en rayon')

console.log('ok')
