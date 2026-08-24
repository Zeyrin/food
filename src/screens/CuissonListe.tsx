import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import { cuisineRecemment, type Historique } from '../lib/propose'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  historique: Historique
  onCuisiner: (recipeId: string) => void
}

export default function CuissonListe({ recipes, basket, historique, onCuisiner }: Props) {
  const { t } = useLangue()
  const byId = new Map(recipes.map((r) => [r.id, r]))

  /**
   * Les plats déjà faits cette semaine passent derrière, sans
   * disparaître : on peut vouloir refaire le même, ou juste relire une
   * étape. L'écran répond d'abord à « qu'est-ce qu'il reste à
   * cuisiner ? », qui est la question qu'on se pose en l'ouvrant.
   */
  const fait = (recipeId: string) => cuisineRecemment(historique, recipeId)
  const ordonne = [...basket].sort((a, b) => Number(fait(a.recipeId)) - Number(fait(b.recipeId)))
  const restants = basket.filter((e) => !fait(e.recipeId)).length

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="grill" />
        <h1>{t('cuissonListe.titre')}</h1>
      </div>
    </header>
  )

  if (basket.length === 0) {
    return (
      <>
        {entete}
        <p className="vide">{t('cuissonListe.videTexte')}</p>
      </>
    )
  }

  return (
    <>
      {entete}
      <p className="aide">
        {restants === 0
          ? t('cuissonListe.tousFaits')
          : t('cuissonListe.restants', { restants, total: basket.length })}
      </p>

      {/* Même carte-vignette que Proposer plutôt que la petite ligne
          d'avant : choisir quoi cuisiner mérite d'être aussi appétissant
          que choisir quoi ajouter — et ça évite un bouton imbriqué dans
          un bouton (la carte entière est déjà l'unique cible tactile). */}
      <div className="grille-recettes">
        {ordonne.map((entree, i) => {
          const r = byId.get(entree.recipeId)
          if (!r) return null
          const dejaFait = fait(entree.recipeId)
          return (
            <button
              className="carte carte-recette"
              key={entree.recipeId}
              data-fait={dejaFait ? 'true' : undefined}
              onClick={() => onCuisiner(r.id)}
              style={
                {
                  '--teinte': teinteRecette(r.titre),
                  '--rang': Math.min(i, 20),
                } as React.CSSProperties
              }
            >
              <div className="vignette" aria-hidden="true">
                {r.titre.charAt(0)}
                <ImageRecette src={r.image} />
                <span className="badge-temps">
                  <Icone nom="minuteur" taille={12} /> {t('cuissonListe.minutes', { n: r.temps })}
                </span>
              </div>
              <div className="carte-recette-corps">
                <h3>{r.titre}</h3>
                <div className="carte-cuisson-pied">
                  <span className="meta">
                    {dejaFait
                      ? t('cuissonListe.dejaCuisine')
                      : t('cuissonListe.parts', {
                          n: entree.portions,
                          s: entree.portions > 1 ? 's' : '',
                        })}
                  </span>
                  <Icone nom={dejaFait ? 'coche' : 'suivant'} taille={16} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
