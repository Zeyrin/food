/**
 * Ce que dit le paywall d'une formule, sans dépendre du SDK : de quoi le
 * tester sous Node. Apple exige que l'écran dise exactement ce qu'on
 * paie, combien, à quel rythme, et ce qui se passe après l'essai — c'est
 * donc ici, et pas dans le composant, que ces phrases se décident.
 */
export type Unite = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

/** Le sous-ensemble d'un paquet RevenueCat dont le paywall a besoin. */
export interface Formule {
  packageType: string
  product: {
    priceString: string
    price: number
    currencyCode?: string
    /** ISO 8601 : P1M, P1Y… */
    subscriptionPeriod: string | null
    introPrice: {
      price: number
      priceString: string
      periodUnit: string
      periodNumberOfUnits: number
      cycles: number
    } | null
  }
}

/** Les deux gestes que FFFood+ ouvre, dans l'ordre où le paywall les cite. */
export const AVANTAGES = ['recettes', 'foyer'] as const
export type Avantage = (typeof AVANTAGES)[number]

/** P1M → MONTH, P1Y → YEAR, P1W → WEEK ; null si inconnu. */
export function uniteDePeriode(iso: string | null): Unite | null {
  const m = iso?.match(/^P(\d+)([DWMY])$/)
  if (!m) return null
  return ({ D: 'DAY', W: 'WEEK', M: 'MONTH', Y: 'YEAR' } as const)[m[2] as 'D' | 'W' | 'M' | 'Y']
}

/** L'option à vie : un achat unique, sans renouvellement. */
export function estAVie(formule: Formule): boolean {
  return formule.packageType === 'LIFETIME'
}

/** Clé i18n de la période facturée : « / mois », « / an », « une fois »… */
export function clePeriode(formule: Formule): string {
  if (estAVie(formule)) return 'plus.periode.LIFETIME'
  const u =
    uniteDePeriode(formule.product.subscriptionPeriod) ??
    (formule.packageType === 'ANNUAL' ? 'YEAR' : formule.packageType === 'MONTHLY' ? 'MONTH' : null)
  return `plus.periode.${u ?? 'MONTH'}`
}

/** Un essai gratuit : sa durée, en nombre et unité ; null sinon. */
export function essaiGratuit(formule: Formule): { n: number; unite: Unite } | null {
  const intro = formule.product.introPrice
  if (!intro || intro.price !== 0) return null
  const unite = intro.periodUnit as Unite
  if (!['DAY', 'WEEK', 'MONTH', 'YEAR'].includes(unite)) return null
  return { n: intro.periodNumberOfUnits * Math.max(1, intro.cycles), unite }
}

/**
 * L'économie de l'annuel sur douze mois au prix mensuel, en pourcent
 * arrondi vers le bas — jamais gonflée. null quand elle ne se calcule
 * pas honnêtement (devises différentes, pas d'économie).
 */
export function economieAnnuelle(annuel: Formule, mensuel: Formule): number | null {
  if (uniteDePeriode(annuel.product.subscriptionPeriod) !== 'YEAR') return null
  if (uniteDePeriode(mensuel.product.subscriptionPeriod) !== 'MONTH') return null
  if (annuel.product.currencyCode && annuel.product.currencyCode !== mensuel.product.currencyCode) return null
  const plein = mensuel.product.price * 12
  if (plein <= 0) return null
  const pct = Math.floor((1 - annuel.product.price / plein) * 100)
  return pct >= 5 ? pct : null
}
