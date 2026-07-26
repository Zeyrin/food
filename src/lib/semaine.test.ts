import assert from 'node:assert/strict'
import { numeroSemaine } from './semaine'

const s = (iso: string) => numeroSemaine(new Date(`${iso}T12:00:00`))

// Cas de référence ISO 8601 : le 1er janvier appartient tantôt à la
// semaine 1, tantôt à la dernière semaine de l'année précédente.
assert.equal(s('2026-01-01'), 1) // jeudi → semaine 1
assert.equal(s('2021-01-01'), 53) // vendredi → semaine 53 de 2020
assert.equal(s('2023-01-01'), 52) // dimanche → semaine 52 de 2022

// Une semaine commence le lundi et finit le dimanche.
assert.equal(s('2026-07-20'), 30)
assert.equal(s('2026-07-26'), 30)
assert.equal(s('2026-07-27'), 31)

// Une année à 53 semaines va bien jusqu'à 53.
assert.equal(s('2020-12-31'), 53)
assert.equal(s('2026-12-31'), 53)

console.log('ok')
