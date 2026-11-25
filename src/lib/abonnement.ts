/**
 * FFFood+ : l'abonnement des apps des stores, vendu par les achats
 * intégrés d'Apple et de Google, à travers RevenueCat.
 *
 * Ce qui est payant tient en deux gestes (voir `src/lib/offre.ts`) :
 * ajouter ses propres recettes, et inviter quelqu'un dans la maison.
 * Tout le reste — catalogue, panier, liste, cuisson, minuteurs — reste
 * gratuit, et le site aussi : Apple interdit de renvoyer depuis l'app
 * vers un paiement extérieur, et le site n'a pas (encore) de paiement.
 *
 * Pas de compte : RevenueCat attribue un identifiant anonyme à
 * l'appareil, et l'abonnement est rattaché au compte App Store / Google
 * Play. « Restaurer mes achats » le retrouve sur un nouveau téléphone.
 *
 * Hors ligne, l'app doit continuer de marcher en magasin : le dernier
 * état connu est gardé en local et sert tant que le store ne répond pas.
 */
import { Capacitor } from '@capacitor/core'
import {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  Purchases,
  type CustomerInfo,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor'
import { NATIF } from './plateforme'

/** L'identifiant du droit (« entitlement ») configuré dans RevenueCat. */
export const DROIT_PLUS = 'plus'

const CLE_CACHE = 'fffood:plus'

const CLE_API =
  Capacitor.getPlatform() === 'ios'
    ? (import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined)
    : (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined)

/**
 * Le paywall n'existe que dans l'app des stores, et seulement quand une
 * clé RevenueCat a été fournie au build. Sans clé (build de dev, APK de
 * debug du workflow), tout est ouvert : un paywall qui ne peut rien
 * vendre serait un écran mort, exactement ce que la revue refuse.
 */
export const ABONNEMENT_ACTIF = NATIF && !!CLE_API

let configure: Promise<boolean> | null = null

function configurer(): Promise<boolean> {
  if (!ABONNEMENT_ACTIF) return Promise.resolve(false)
  configure ??= (async () => {
    try {
      if (import.meta.env.DEV) await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
      await Purchases.configure({ apiKey: CLE_API! })
      return true
    } catch (e) {
      console.warn('RevenueCat indisponible', e)
      configure = null
      return false
    }
  })()
  return configure
}

export function aLeDroit(info: CustomerInfo): boolean {
  return DROIT_PLUS in info.entitlements.active
}

/** Le dernier état connu, pour le premier rendu et le hors-ligne. */
export function plusEnCache(): boolean {
  if (!ABONNEMENT_ACTIF) return true
  try {
    return localStorage.getItem(CLE_CACHE) === '1'
  } catch {
    return false
  }
}

function memoriser(plus: boolean): boolean {
  try {
    if (plus) localStorage.setItem(CLE_CACHE, '1')
    else localStorage.removeItem(CLE_CACHE)
  } catch {
    /* stockage refusé : on redemandera au store au prochain lancement */
  }
  return plus
}

/** L'état réel, demandé au store ; le cache si le store ne répond pas. */
export async function verifierPlus(): Promise<boolean> {
  if (!ABONNEMENT_ACTIF) return true
  if (!(await configurer())) return plusEnCache()
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return memoriser(aLeDroit(customerInfo))
  } catch {
    return plusEnCache()
  }
}

/** Prévenu quand l'abonnement change (achat, renouvellement, expiration). */
export function suivrePlus(quandChange: (plus: boolean) => void): () => void {
  if (!ABONNEMENT_ACTIF) return () => {}
  let id: string | null = null
  let annule = false
  void configurer().then(async (ok) => {
    if (!ok || annule) return
    id = await Purchases.addCustomerInfoUpdateListener((info) => quandChange(memoriser(aLeDroit(info))))
  })
  return () => {
    annule = true
    if (id) void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id })
  }
}

/** Les formules proposées (offre « current » de RevenueCat), annuelle d'abord. */
export async function chargerFormules(): Promise<PurchasesPackage[]> {
  if (!(await configurer())) return []
  const offres = await Purchases.getOfferings()
  const paquets = offres.current?.availablePackages ?? []
  const rang = (p: PurchasesPackage) => (p.packageType === 'ANNUAL' ? 0 : p.packageType === 'MONTHLY' ? 1 : 2)
  return [...paquets].sort((a, b) => rang(a) - rang(b))
}

export type ResultatAchat = 'achete' | 'annule' | 'en-attente'

export async function acheter(paquet: PurchasesPackage): Promise<ResultatAchat> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: paquet })
    return memoriser(aLeDroit(customerInfo)) ? 'achete' : 'en-attente'
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'annule'
    // Achat différé (contrôle parental « Demander à acheter ») : ce
    // n'est pas un échec, il aboutira plus tard par `suivrePlus`.
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'en-attente'
    throw e
  }
}

/** « Restaurer mes achats » : vrai si un abonnement actif a été retrouvé. */
export async function restaurer(): Promise<boolean> {
  if (!(await configurer())) return false
  const { customerInfo } = await Purchases.restorePurchases()
  return memoriser(aLeDroit(customerInfo))
}

/** La page du store où l'on gère ou résilie son abonnement. */
export async function lienGestion(): Promise<string> {
  const defaut =
    Capacitor.getPlatform() === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions'
  if (!(await configurer())) return defaut
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo.managementURL ?? defaut
  } catch {
    return defaut
  }
}

/** Oublier l'abonnement côté appareil (effacement des données). */
export function oublierPlus(): void {
  memoriser(false)
}
