import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lirePartage } from './partageRecu'

test("trouve l'adresse où que l'app l'ait rangée", () => {
  assert.deepEqual(lirePartage('/partage/', '?url=https%3A%2F%2Fexemple.fr%2Ftarte'), { url: 'https://exemple.fr/tarte' })
  assert.deepEqual(
    lirePartage('/partage', '?title=Tarte&text=Regarde%20cette%20recette%20%3A%20https%3A%2F%2Fexemple.fr%2Ftarte%20!'),
    { url: 'https://exemple.fr/tarte' },
  )
})

test("le champ url passe avant le texte", () => {
  assert.deepEqual(
    lirePartage('/partage/', '?text=voir%20https%3A%2F%2Fautre.fr&url=https%3A%2F%2Fexemple.fr%2Ftarte'),
    { url: 'https://exemple.fr/tarte' },
  )
})

test('un partage sans adresse est reconnu, mais vide', () => {
  assert.deepEqual(lirePartage('/partage/', '?text=une%20id%C3%A9e%20de%20d%C3%AEner'), { url: null })
  assert.deepEqual(lirePartage('/partage/', ''), { url: null })
})

test("ignore ce qui n'est pas un partage", () => {
  assert.equal(lirePartage('/', '?url=https%3A%2F%2Fexemple.fr'), null)
  assert.equal(lirePartage('/partage/autre', '?url=https%3A%2F%2Fexemple.fr'), null)
})
