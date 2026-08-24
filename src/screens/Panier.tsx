import { useEffect, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import { numeroSemaine } from '../lib/semaine'
import { cuisineRecemment, type Historique } from '../lib/propose'
import { useLangue } from '../lib/i18n'
import { mesurer } from '../lib/mesure'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  historique: Historique
  onBasket: (basket: BasketEntry[]) => void
  onVersPropose: () => void
  onVersListe: () => void
  onAjouterRecette: () => void
  /** Vide le panier *et* la liste (cases cochées comprises) — voir App.tsx. */
  onViderPanier: () => void
}

export default function Panier({
  recipes,
  basket,
  historique,
  onBasket,
  onVersPropose,
  onVersListe,
  onAjouterRecette,
  onViderPanier,
}: Props) {
  const { t } = useLangue()

  /** « 150 » → « 2 h 30 ». Une durée de semaine se lit en heures. */
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return t('panier.minutes', { n: minutes })
    const reste = minutes % 60
    return t('panier.heures', { h: Math.floor(minutes / 60), reste: reste ? ` ${reste}` : '' })
  }

  const byId = new Map(recipes.map((r) => [r.id, r]))
  const [confirmation, setConfirmation] = useState(false)

  /**
   * Retirer un plat est à un doigt, sans confirmation — et c'est bien :
   * une confirmation à chaque retrait rendrait le tri du panier
   * pénible. Mais le geste rate, et retrouver le bon plat dans le
   * catalogue coûte plus cher que le retrait n'a coûté. Le rattrapage
   * prend la place exacte de la carte disparue, le temps de quelques
   * secondes : pas de bandeau flottant de plus au-dessus du pouce.
   */
  const [retire, setRetire] = useState<{ entree: BasketEntry; rang: number } | null>(null)

  useEffect(() => {
    if (!retire) return
    const t = setTimeout(() => setRetire(null), 8000)
    return () => clearTimeout(t)
  }, [retire])

  const setPortions = (recipeId: string, portions: number) =>
    onBasket(basket.map((e) => (e.recipeId === recipeId ? { ...e, portions } : e)))

  const retirer = (recipeId: string) => {
    const rang = basket.findIndex((e) => e.recipeId === recipeId)
    const entree = basket[rang]
    if (!entree) return
    setRetire({ entree, rang })
    onBasket(basket.filter((e) => e.recipeId !== recipeId))
  }

  // Réinséré à sa place d'origine, pas à la fin : le panier garde
  // l'ordre dans lequel on a composé la semaine.
  const annulerRetrait = () => {
    if (!retire) return
    const suivant = [...basket]
    suivant.splice(Math.min(retire.rang, suivant.length), 0, retire.entree)
    onBasket(suivant)
    setRetire(null)
  }

  const rattrapage = retire && (
    <div className="carte carte-annulation" role="status">
      <p>{t('panier.retireDuPanier', { titre: byId.get(retire.entree.recipeId)?.titre ?? '' })}</p>
      <button className="discret" onClick={annulerRetrait}>
        <Icone nom="precedent" taille={16} /> {t('panier.annuler')}
      </button>
    </div>
  )

  const parts = basket.reduce((total, e) => total + e.portions, 0)
  const tempsTotal = basket.reduce((total, e) => total + (byId.get(e.recipeId)?.temps ?? 0), 0)
  const aCuisiner = basket.filter((e) => !cuisineRecemment(historique, e.recipeId)).length

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="panier" />
        <h1>{t('panier.titre')}</h1>
      </div>
    </header>
  )

  /**
   * La semaine a une fin, et rien ne la marquait : il fallait retirer
   * les plats un par un, et les cases cochées — dont la clé est le nom
   * de l'ingrédient, donc stable d'une semaine à l'autre — revenaient
   * déjà cochées sur la liste suivante.
   */
  const viderLePanier = (
    <>
      <h2>{t('panier.viderLePanier')}</h2>
      {confirmation ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label={t('panier.viderLePanier')}>
          <p>{t('panier.viderConfirmation', { n: basket.length, s: basket.length > 1 ? 's' : '' })}</p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setConfirmation(false)}>
              {t('panier.annuler')}
            </button>
            <button
              className="discret danger"
              onClick={() => {
                setConfirmation(false)
                onViderPanier()
              }}
            >
              {t('panier.vider')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="aide">{t('panier.viderTexte')}</p>
          <button className="discret suite pleine-largeur" onClick={() => setConfirmation(true)}>
            {t('panier.viderLePanier')}
          </button>
        </>
      )}
    </>
  )

  const complements = (
    <>
      <h2>{t('panier.completerSemaine')}</h2>
      <div className="bento-deux-colonnes">
        <button className="carte-bento" onClick={onVersPropose}>
          <Icone nom="plus-cercle" taille={28} />
          <p>{t('panier.ajouterPlatRapide')}</p>
        </button>
        <button className="carte-bento neutre" onClick={onAjouterRecette}>
          <Icone nom="plus-cercle" taille={28} />
          <p>{t('panier.nouvelleRecette')}</p>
        </button>
      </div>
    </>
  )

  if (basket.length === 0) {
    return (
      <>
        {entete}
        {rattrapage}
        <p className="vide">{t('panier.videTexte')}</p>
        {complements}
      </>
    )
  }

  return (
    <>
      {entete}

      {/* L'aperçu affichait « Prêt à générer », une étiquette qui ne
          disait rien de la semaine et ne changeait jamais. Les chiffres
          qu'on veut vraiment : combien de parts ça fait, combien de
          temps de cuisine ça représente, et ce qu'il reste à cuisiner. */}
      <section className="carte-resume carte-resume-semaine">
        <p className="carte-resume-label">{t('panier.apercuSemaine')}</p>
        <div className="carte-resume-rangee">
          <div>
            <h2 className="carte-resume-nombre">{t('panier.plats', { n: basket.length, s: basket.length > 1 ? 's' : '' })}</h2>
            {/* Deux lignes courtes plutôt qu'une longue : sur 390 px, tout
                mettre bout à bout renvoyait « de cuisine » à la ligne et
                poussait la pastille sous le bloc. */}
            <p className="carte-resume-sous">
              {t('panier.semaine', { n: numeroSemaine(), parts, s: parts > 1 ? 's' : '' })}
            </p>
            <p className="carte-resume-detail">{t('panier.tempsCuisine', { temps: formatMinutes(tempsTotal) })}</p>
          </div>
          <span className="pastille-etat" data-fini={aCuisiner === 0 ? 'true' : undefined}>
            {aCuisiner === 0 ? t('panier.toutCuisine') : t('panier.aCuisiner', { n: aCuisiner })}
          </span>
        </div>
      </section>

      <h2>{t('panier.selectionnes')}</h2>

      {rattrapage}

      <div className="grille-panier">
        {basket.map((entree) => {
          const r = byId.get(entree.recipeId)
          if (!r) return null
          return (
            <div className="carte carte-panier" key={entree.recipeId}>
              <div
                className="vignette-mini"
                aria-hidden="true"
                style={{ '--teinte': teinteRecette(r.titre) } as React.CSSProperties}
              >
                {r.titre.charAt(0)}
                <ImageRecette src={r.image} />
              </div>
              <div className="carte-panier-corps">
                <div className="ligne-titre-panier">
                  <h3>{r.titre}</h3>
                  <button
                    className="bouton-rond-discret bouton-retirer"
                    onClick={() => retirer(entree.recipeId)}
                    aria-label={t('panier.retirerPlat', { titre: r.titre })}
                  >
                    <Icone nom="fermer" taille={18} />
                  </button>
                </div>
                <div className="compteur">
                  <button
                    onClick={() => setPortions(entree.recipeId, Math.max(1, entree.portions - 1))}
                    aria-label={t('panier.moinsDeParts', { titre: r.titre })}
                  >
                    <Icone nom="moins" taille={16} />
                  </button>
                  <span>{entree.portions}</span>
                  <button
                    onClick={() => setPortions(entree.recipeId, entree.portions + 1)}
                    aria-label={t('panier.plusDeParts', { titre: r.titre })}
                  >
                    <Icone nom="plus" taille={16} />
                  </button>
                  <span className="compteur-label">{t('panier.portions')}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {complements}

      {viderLePanier}

      <div className="espaceur-action-flottante" aria-hidden="true" />

      <div className="action-flottante">
        <button
          className="principal"
          onClick={() => {
            mesurer('liste_generee', { plats: basket.length, parts, minutes: tempsTotal })
            onVersListe()
          }}
        >
          <Icone nom="panier" taille={20} /> {t('panier.genererListe')}
        </button>
      </div>
    </>
  )
}
