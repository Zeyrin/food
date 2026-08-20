import { useEffect, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import { numeroSemaine } from '../lib/semaine'
import { cuisineRecemment, type Historique } from '../lib/propose'
import Icone from '../components/Icone'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  historique: Historique
  onBasket: (basket: BasketEntry[]) => void
  onVersPropose: () => void
  onVersListe: () => void
  onAjouterRecette: () => void
  /** Vide le panier *et* la liste (cases cochées comprises) — voir App.tsx. */
  onViderSemaine: () => void
}

/** « 150 » → « 2 h 30 ». Une durée de semaine se lit en heures. */
const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`
  const reste = minutes % 60
  return `${Math.floor(minutes / 60)} h${reste ? ` ${reste}` : ''}`
}

export default function Panier({
  recipes,
  basket,
  historique,
  onBasket,
  onVersPropose,
  onVersListe,
  onAjouterRecette,
  onViderSemaine,
}: Props) {
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
      <p>« {byId.get(retire.entree.recipeId)?.titre ?? 'Plat'} » retiré du panier.</p>
      <button className="discret" onClick={annulerRetrait}>
        <Icone nom="precedent" taille={16} /> Annuler
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
        <h1>Panier</h1>
      </div>
    </header>
  )

  /**
   * La semaine a une fin, et rien ne la marquait : il fallait retirer
   * les plats un par un, et les cases cochées — dont la clé est le nom
   * de l'ingrédient, donc stable d'une semaine à l'autre — revenaient
   * déjà cochées sur la liste suivante.
   */
  const finDeSemaine = (
    <>
      <h2>Nouvelle semaine</h2>
      {confirmation ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label="Confirmer la remise à zéro">
          <p>
            Vider les {basket.length} plats du panier et la liste de courses, cases cochées comprises ? Le
            catalogue de recettes, lui, ne bouge pas.
          </p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setConfirmation(false)}>
              Annuler
            </button>
            <button
              className="discret danger"
              onClick={() => {
                setConfirmation(false)
                onViderSemaine()
              }}
            >
              Vider
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="aide">
            Courses faites et plats cuisinés ? Repartez d'un panier et d'une liste vides.
          </p>
          <button className="discret suite pleine-largeur" onClick={() => setConfirmation(true)}>
            Vider la semaine
          </button>
        </>
      )}
    </>
  )

  const complements = (
    <>
      <h2>Compléter ma semaine</h2>
      <div className="bento-deux-colonnes">
        <button className="carte-bento" onClick={onVersPropose}>
          <Icone nom="plus-cercle" taille={28} />
          <p>Ajouter un plat rapide</p>
        </button>
        <button className="carte-bento neutre" onClick={onAjouterRecette}>
          <Icone nom="plus-cercle" taille={28} />
          <p>Nouvelle recette</p>
        </button>
      </div>
    </>
  )

  if (basket.length === 0) {
    return (
      <>
        {entete}
        {rattrapage}
        <p className="vide">Rien pour l'instant. Choisissez des recettes dans « Proposer ».</p>
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
        <p className="carte-resume-label">Aperçu semaine</p>
        <div className="carte-resume-rangee">
          <div>
            <h2 className="carte-resume-nombre">
              {basket.length} plat{basket.length > 1 ? 's' : ''}
            </h2>
            {/* Deux lignes courtes plutôt qu'une longue : sur 390 px, tout
                mettre bout à bout renvoyait « de cuisine » à la ligne et
                poussait la pastille sous le bloc. */}
            <p className="carte-resume-sous">
              Semaine {numeroSemaine()} · {parts} part{parts > 1 ? 's' : ''}
            </p>
            <p className="carte-resume-detail">{formatMinutes(tempsTotal)} de cuisine</p>
          </div>
          <span className="pastille-etat" data-fini={aCuisiner === 0 ? 'true' : undefined}>
            {aCuisiner === 0 ? 'Tout est cuisiné' : `${aCuisiner} à cuisiner`}
          </span>
        </div>
      </section>

      <h2>Sélectionnés</h2>

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
                {r.image ? <img src={r.image} alt="" /> : r.titre.charAt(0)}
              </div>
              <div className="carte-panier-corps">
                <div className="ligne-titre-panier">
                  <h3>{r.titre}</h3>
                  <button
                    className="bouton-rond-discret bouton-retirer"
                    onClick={() => retirer(entree.recipeId)}
                    aria-label={`Retirer ${r.titre} du panier`}
                  >
                    <Icone nom="fermer" taille={18} />
                  </button>
                </div>
                <div className="compteur">
                  <button
                    onClick={() => setPortions(entree.recipeId, Math.max(1, entree.portions - 1))}
                    aria-label={`Moins de parts pour ${r.titre}`}
                  >
                    <Icone nom="moins" taille={16} />
                  </button>
                  <span>{entree.portions}</span>
                  <button
                    onClick={() => setPortions(entree.recipeId, entree.portions + 1)}
                    aria-label={`Plus de parts pour ${r.titre}`}
                  >
                    <Icone nom="plus" taille={16} />
                  </button>
                  <span className="compteur-label">Portions</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {complements}

      {finDeSemaine}

      <div className="espaceur-action-flottante" aria-hidden="true" />

      <div className="action-flottante">
        <button className="principal" onClick={onVersListe}>
          <Icone nom="panier" taille={20} /> Générer la liste de courses
        </button>
      </div>
    </>
  )
}
