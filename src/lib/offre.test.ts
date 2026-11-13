import assert from 'node:assert/strict'
import { clePeriode, economieAnnuelle, essaiGratuit, estAVie, uniteDePeriode, type Formule } from './offre'

const formule = (f: Partial<Formule['product']> & { packageType?: string }): Formule => ({
  packageType: f.packageType ?? 'CUSTOM',
  product: {
    priceString: f.priceString ?? '1 €',
    price: f.price ?? 1,
    currencyCode: f.currencyCode ?? 'EUR',
    subscriptionPeriod: f.subscriptionPeriod ?? null,
    introPrice: f.introPrice ?? null,
  },
})

assert.equal(uniteDePeriode('P1M'), 'MONTH')
assert.equal(uniteDePeriode('P1Y'), 'YEAR')
assert.equal(uniteDePeriode('P1W'), 'WEEK')
assert.equal(uniteDePeriode(null), null)
assert.equal(uniteDePeriode('n/a'), null)

// La période vient du produit ; à défaut, du type de paquet.
assert.equal(clePeriode(formule({ subscriptionPeriod: 'P1Y' })), 'plus.periode.YEAR')
assert.equal(clePeriode(formule({ packageType: 'MONTHLY' })), 'plus.periode.MONTH')

// Un prix d'intro payant n'est pas un essai gratuit.
assert.equal(
  essaiGratuit(formule({ introPrice: { price: 0.99, priceString: '0,99 €', periodUnit: 'MONTH', periodNumberOfUnits: 1, cycles: 1 } })),
  null,
)
assert.deepEqual(
  essaiGratuit(formule({ introPrice: { price: 0, priceString: '0 €', periodUnit: 'DAY', periodNumberOfUnits: 7, cycles: 1 } })),
  { n: 7, unite: 'DAY' },
)
assert.equal(essaiGratuit(formule({})), null)

// 24,99 €/an contre 3,99 €/mois × 12 = 47,88 € : 47 % d'économie, arrondi vers le bas.
const annuel = formule({ price: 24.99, subscriptionPeriod: 'P1Y' })
const mensuel = formule({ price: 3.99, subscriptionPeriod: 'P1M' })
assert.equal(economieAnnuelle(annuel, mensuel), 47)
// Pas d'économie annoncée quand il n'y en a pas, ni entre deux devises.
assert.equal(economieAnnuelle(formule({ price: 50, subscriptionPeriod: 'P1Y' }), mensuel), null)
assert.equal(economieAnnuelle(formule({ price: 24.99, subscriptionPeriod: 'P1Y', currencyCode: 'USD' }), mensuel), null)

// L'option à vie : payée une fois, jamais présentée comme une période.
const aVie = formule({ packageType: 'LIFETIME', price: 59.99 })
assert.equal(estAVie(aVie), true)
assert.equal(estAVie(annuel), false)
assert.equal(clePeriode(aVie), 'plus.periode.LIFETIME')
