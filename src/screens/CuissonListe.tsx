import type { BasketEntry, Recipe } from '../types'
import { teinteRecette } from '../lib/identite'
import { cuisineRecemment, type Historique } from '../lib/propose'
import { useLangue } from '../lib/i18n'
import { formatMinutes } from '../lib/duree'
import { titreRecette } from '../lib/traduireRecette'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'
import VignettePlaceholder from '../components/VignettePlaceholder'

interface Props {
  recipes: Recipe[]
  basket: BasketEntry[]
  historique: Historique
  onCuisiner: (recipeId: string) => void
  /** Rien à cuisiner : retour au catalogue choisir les plats. */
  onVersPropose: () => void
}

export default function CuissonListe({ recipes, basket, historique, onCuisiner, onVersPropose }: Props) {
  const { t, langue } = useLangue()
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
        <Icone nom="marmite" />
        <h1>{t('cuissonListe.titre')}</h1>
      </div>
    </header>
  )

  if (basket.length === 0) {
    return (
      <>
        {entete}
        <div className="vide">
          <p>{t('cuissonListe.videTexte')}</p>
          <button className="principal suite" onClick={onVersPropose}>
            {t('liste.choisirDesPlats')}
          </button>
        </div>
      </>
    )
  }

  // Le prochain plat à faire, mis en avant : l'écran répond d'abord à
  // « qu'est-ce que je cuisine maintenant ? » — une grande carte et un
  // bouton, comme le « reprendre » d'une appli de lecture. Le reste de la
  // semaine suit, en petit.
  const aLaUne = ordonne.find((e) => !fait(e.recipeId) && byId.has(e.recipeId))
  const suite = ordonne.filter((e) => e !== aLaUne)
  const recetteUne = aLaUne && byId.get(aLaUne.recipeId)

  const carte = (entree: BasketEntry, i: number) => {
    const r = byId.get(entree.recipeId)
    if (!r) return null
    const dejaFait = fait(entree.recipeId)
    // Le titre suit la langue ; la teinte, elle, reste calculée
    // sur le titre du corpus, pour qu'un plat garde sa couleur
    // d'un téléphone à l'autre.
    const titre = titreRecette(r, langue)
    return (
      <button
        className="carte carte-recette"
        key={entree.recipeId}
        data-fait={dejaFait ? 'true' : undefined}
        onClick={() => onCuisiner(r.id)}
        style={
          {
            '--teinte': teinteRecette(r.titre),
            // Voir Propose.tsx : seules les huit premières cartes
            // s'animent, le rang n'a pas à aller plus loin.
            '--rang': Math.min(i, 7),
          } as React.CSSProperties
        }
      >
        <div className="vignette" data-sans-photo={r.image ? undefined : 'true'} aria-hidden="true">
          {!r.image && <VignettePlaceholder recette={r} />}
          <ImageRecette src={r.image} />
          <span className="badge-temps">
            <Icone nom="minuteur" taille={12} /> {formatMinutes(r.temps, t)}
          </span>
        </div>
        <div className="carte-recette-corps">
          <h3>{titre}</h3>
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
  }

  return (
    <>
      {entete}
      <p className="aide">
        {restants === 0
          ? t('cuissonListe.tousFaits')
          : t('cuissonListe.restants', { restants, total: basket.length })}
      </p>

      {aLaUne && recetteUne && (
        <button
          className="carte carte-a-la-une"
          onClick={() => onCuisiner(recetteUne.id)}
          style={{ '--teinte': teinteRecette(recetteUne.titre) } as React.CSSProperties}
        >
          <div className="vignette" data-sans-photo={recetteUne.image ? undefined : 'true'} aria-hidden="true">
            {!recetteUne.image && <VignettePlaceholder recette={recetteUne} />}
            <ImageRecette src={recetteUne.image} />
          </div>
          <div className="carte-a-la-une-corps">
            <p className="carte-resume-label">{t('cuissonListe.ensuite')}</p>
            <h2>{titreRecette(recetteUne, langue)}</h2>
            <p className="carte-a-la-une-meta">
              <Icone nom="minuteur" taille={16} /> {formatMinutes(recetteUne.temps, t)}
              <span aria-hidden="true">·</span>
              {t('cuissonListe.parts', { n: aLaUne.portions, s: aLaUne.portions > 1 ? 's' : '' })}
            </p>
            <span className="carte-a-la-une-action">
              <Icone nom="marmite" taille={20} /> {t('cuissonListe.cuisiner')}
            </span>
          </div>
        </button>
      )}

      {suite.length > 0 && (
        <>
          {aLaUne && <h2 className="titre-rangee titre-suite-cuisson">{t('cuissonListe.aussi')}</h2>}
          {/* Même carte-vignette que Proposer plutôt que la petite ligne
              d'avant : choisir quoi cuisiner mérite d'être aussi appétissant
              que choisir quoi ajouter — et ça évite un bouton imbriqué dans
              un bouton (la carte entière est déjà l'unique cible tactile). */}
          <div className="grille-recettes">{suite.map(carte)}</div>
        </>
      )}
    </>
  )
}
