import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lienInvitation, lireInvitation } from './invitation'

const UUID = '0b3f6d2e-8c1a-4f7e-9d2b-5a6c7e8f9a0b'

test('lit la maison et le prénom du fragment', () => {
  assert.deepEqual(lireInvitation(`#/f/${UUID}?de=Camille`), { foyer: UUID, de: 'Camille' })
  assert.deepEqual(lireInvitation(`#/f/${UUID}`), { foyer: UUID, de: null })
  assert.deepEqual(lireInvitation(`#/f/${UUID.toUpperCase()}?de=`), { foyer: UUID, de: null })
})

test('ignore ce qui n\'est pas une invitation', () => {
  assert.equal(lireInvitation(''), null)
  assert.equal(lireInvitation('#/r/mapo-tofu'), null)
  assert.equal(lireInvitation('#/f/pas-un-uuid'), null)
})

test('le lien rouvre la même invitation', () => {
  const lien = lienInvitation(UUID, '  Zoé & Léa ', 'https://www.fffood.fr')
  assert.equal(lien.startsWith(`https://www.fffood.fr/#/f/${UUID}?de=`), true)
  assert.deepEqual(lireInvitation(new URL(lien).hash), { foyer: UUID, de: 'Zoé & Léa' })
  assert.equal(lienInvitation(UUID, ' ', 'https://www.fffood.fr'), `https://www.fffood.fr/#/f/${UUID}`)
})
