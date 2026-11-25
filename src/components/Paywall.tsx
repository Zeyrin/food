import { useEffect, useState } from 'react'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { acheter, chargerFormules, restaurer } from '../lib/abonnement'
import { useLangue } from '../lib/i18n'
import { mesurer } from '../lib/mesure'
import { AVANTAGES, clePeriode, economieAnnuelle, essaiGratuit, estAVie, type Avantage, type Formule } from '../lib/offre'
import { pageSite } from '../lib/plateforme'
import Icone from './Icone'

/**
 * L'offre FFFood+. Règle d'Apple (3.1.2) et de Google : l'écran dit
 * exactement ce qu'on obtient, pour quel prix, à quel rythme, ce qui
 * se passe après l'essai, comment résilier — et il donne les conditions
 * d'utilisation, la politique de confidentialité et « Restaurer ».
 * Les prix viennent du store (devise et taxes du pays), jamais du code.
 */
interface Props {
  raison?: Avantage
  onFermer: () => void
  onAbonne: () => void
}

type Etat = 'chargement' | 'pret' | 'indisponible'

export default function Paywall({ raison, onFermer, onAbonne }: Props) {
  const { t } = useLangue()
  const [formules, setFormules] = useState<PurchasesPackage[]>([])
  const [choisie, setChoisie] = useState(0)
  const [etat, setEtat] = useState<Etat>('chargement')
  const [enCours, setEnCours] = useState<'achat' | 'restauration' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const charger = () => {
    setEtat('chargement')
    chargerFormules()
      .then((f) => {
        setFormules(f)
        setChoisie(0)
        setEtat(f.length > 0 ? 'pret' : 'indisponible')
      })
      .catch(() => setEtat('indisponible'))
  }
  useEffect(charger, [])

  // Échap ferme, comme les autres feuilles de l'app.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && !enCours && onFermer()
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [enCours, onFermer])

  const formule = formules[choisie]
  const essai = formule ? essaiGratuit(formule as Formule) : null
  const annuel = formules.find((f) => f.packageType === 'ANNUAL')
  const mensuel = formules.find((f) => f.packageType === 'MONTHLY')
  const economie = annuel && mensuel ? economieAnnuelle(annuel as Formule, mensuel as Formule) : null

  const prixPeriode = (f: PurchasesPackage) => `${f.product.priceString} ${t(clePeriode(f as Formule))}`
  const dureeEssai = (e: NonNullable<typeof essai>) => t(`plus.duree.${e.unite}`, { n: e.n })

  const sAbonner = async () => {
    if (!formule) return
    setEnCours('achat')
    setMessage(null)
    try {
      const resultat = await acheter(formule)
      if (resultat === 'achete') {
        mesurer('abonnement_pris', { formule: formule.packageType })
        onAbonne()
      } else if (resultat === 'en-attente') {
        setMessage(t('plus.enAttente'))
      }
    } catch {
      setMessage(t('plus.erreurAchat'))
    } finally {
      setEnCours(null)
    }
  }

  const restaurerAchats = async () => {
    setEnCours('restauration')
    setMessage(null)
    try {
      if (await restaurer()) {
        mesurer('achats_restaures')
        onAbonne()
      } else {
        setMessage(t('plus.rienARestaurer'))
      }
    } catch {
      setMessage(t('plus.erreurRestauration'))
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="voile-offre" onClick={() => !enCours && onFermer()}>
      <section
        className="feuille-offre"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-offre"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="fermer-offre" onClick={onFermer} disabled={!!enCours} aria-label={t('plus.fermer')}>
          <Icone nom="fermer" taille={20} />
        </button>

        <p className="offre-marque">
          <Icone nom="etincelle" taille={18} /> FFFood+
        </p>
        <h2 id="titre-offre">{raison ? t(`plus.raison.${raison}`) : t('plus.titre')}</h2>

        <ul className="offre-avantages">
          {AVANTAGES.map((a) => (
            <li key={a}>
              <Icone nom={a === 'recettes' ? 'crayon' : 'lien'} taille={20} />
              <div>
                <b>{t(`plus.avantage.${a}.titre`)}</b>
                <p>{t(`plus.avantage.${a}.texte`)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="offre-gratuit">{t('plus.toujoursGratuit')}</p>

        {etat === 'chargement' && <p className="aide offre-attente">{t('plus.chargement')}</p>}

        {etat === 'indisponible' && (
          <div className="bloc-erreurs" role="status">
            <p>{t('plus.indisponible')}</p>
            <button className="discret" onClick={charger}>
              <Icone nom="rafraichir" taille={18} /> {t('plus.reessayer')}
            </button>
          </div>
        )}

        {etat === 'pret' && (
          <>
            <div className="offre-formules" role="radiogroup" aria-label={t('plus.formules')}>
              {formules.map((f, i) => {
                const e = essaiGratuit(f as Formule)
                return (
                  <button
                    key={f.identifier}
                    role="radio"
                    aria-checked={i === choisie}
                    className={'offre-formule' + (i === choisie ? ' choisie' : '')}
                    onClick={() => setChoisie(i)}
                    disabled={!!enCours}
                  >
                    <span className="offre-formule-nom">
                      {t(`plus.formule.${f.packageType === 'ANNUAL' ? 'annuelle' : f.packageType === 'MONTHLY' ? 'mensuelle' : f.packageType === 'LIFETIME' ? 'aVie' : 'autre'}`)}
                      {f === annuel && economie !== null && (
                        <span className="offre-economie">{t('plus.economie', { pct: economie })}</span>
                      )}
                    </span>
                    <span className="offre-formule-prix">{prixPeriode(f)}</span>
                    {e && <span className="offre-formule-essai">{t('plus.essaiInclus', { duree: dureeEssai(e) })}</span>}
                  </button>
                )
              })}
            </div>

            <button className="principal pleine-largeur" onClick={() => void sAbonner()} disabled={!!enCours}>
              {enCours === 'achat'
                ? t('plus.achatEnCours')
                : essai
                  ? t('plus.commencerEssai', { duree: dureeEssai(essai) })
                  : estAVie(formule as Formule)
                    ? t('plus.acheterAVie', { prix: formule!.product.priceString })
                    : t('plus.sAbonner', { prix: prixPeriode(formule!) })}
            </button>

            {/* Ce qui sera prélevé, et quand : la phrase que la revue cherche. */}
            <p className="offre-conditions">
              {/* L'achat à vie ne se renouvelle pas : ne pas parler de résiliation. */}
              {estAVie(formule as Formule)
                ? t('plus.conditionsAVie', { prix: formule!.product.priceString })
                : (essai
                    ? t('plus.conditionsEssai', { duree: dureeEssai(essai), prix: prixPeriode(formule!) })
                    : t('plus.conditions', { prix: prixPeriode(formule!) })) +
                  ' ' +
                  t('plus.resiliation')}
            </p>
          </>
        )}

        {message && (
          <p className="aide offre-message" role="status">
            {message}
          </p>
        )}

        <div className="offre-liens">
          <button className="lien-discret" onClick={() => void restaurerAchats()} disabled={!!enCours}>
            {enCours === 'restauration' ? t('plus.restaurationEnCours') : t('plus.restaurer')}
          </button>
          <a href={pageSite('/conditions.html')} target="_blank" rel="noopener noreferrer">
            {t('plus.cgu')}
          </a>
          <a href={pageSite('/donnees.html')} target="_blank" rel="noopener noreferrer">
            {t('plus.confidentialite')}
          </a>
        </div>
      </section>
    </div>
  )
}
