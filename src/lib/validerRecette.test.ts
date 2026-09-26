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

// Pas de tuto vidéo : c'est le cas courant, et il reste valide.
assert.equal(ok(base).video, undefined)

// Une adresse https passe, débarrassée de ses espaces.
assert.equal(
  ok({ ...base, video: '  https://www.youtube.com/watch?v=abc123  ' }).video,
  'https://www.youtube.com/watch?v=abc123',
)

// Tout le reste est refusé, et le dit. `javascript:` et `data:` sont le
// cœur du test : ce champ finit dans le `href` d'un lien, et un JSON
// collé depuis n'importe où pourrait les porter.
for (const video of [
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'http://exemple.fr/tuto',
  '//exemple.fr/tuto',
  'cherche « dahl » sur YouTube',
  '',
  '   ',
  42,
  { url: 'https://exemple.fr' },
]) {
  const erreurs = ko({ ...base, video })
  assert.ok(
    erreurs.some((e) => e.includes('video')),
    `« ${String(video)} » aurait dû être refusée avec un message sur « video »`,
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
