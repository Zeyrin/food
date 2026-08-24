import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Le filet sous l'app. Une exception pendant un rendu React démonte
 * tout l'arbre : sans limite d'erreur, l'écran devient blanc et
 * définitivement muet — pas de message, pas de bouton, et sur une PWA
 * installée pas même une barre d'adresse pour recharger. Le foyer, le
 * panier et la liste sont pourtant intacts sur l'appareil et côté
 * Supabase : il ne manquait qu'un moyen de revenir.
 *
 * On ne tente pas de rendre à nouveau l'arbre fautif tout seul — le
 * même rendu produirait la même exception en boucle. Un rechargement
 * est un geste explicite, et il repart d'un état propre.
 */

interface Props {
  children: ReactNode
  titre: string
  texte: string
  recharger: string
  details: string
}

interface State {
  erreur: Error | null
}

class Filet extends Component<Props, State> {
  state: State = { erreur: null }

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur }
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    // La console est le seul endroit où la pile survit : l'écran de
    // repli, lui, n'affiche que le message.
    console.error('Rendu interrompu :', erreur, infos.componentStack)
  }

  render() {
    const { erreur } = this.state
    if (!erreur) return this.props.children

    return (
      <div className="ecran-erreur" role="alert">
        <div className="ecran-erreur-icone" aria-hidden="true">
          <Icone nom="alerte" taille={32} />
        </div>
        <h1>{this.props.titre}</h1>
        <p>{this.props.texte}</p>
        <button className="principal" onClick={() => location.reload()}>
          {this.props.recharger}
        </button>
        {/* Replié : ce n'est pas ce qu'on lit en premier, mais c'est la
            seule trace lisible sur un téléphone où la console n'est pas
            ouvrable. */}
        <details className="ecran-erreur-details">
          <summary>{this.props.details}</summary>
          <pre>{erreur.message}</pre>
        </details>
      </div>
    )
  }
}

/**
 * La limite d'erreur doit être une classe (React n'expose pas
 * `getDerivedStateFromError` aux hooks), donc les libellés lui
 * arrivent en props, traduits ici. Ce composant vit sous
 * `FournisseurLangue` : quand le repli s'affiche, c'est l'arbre
 * en dessous qui a échoué, pas le fournisseur.
 */
export default function LimiteErreur({ children }: { children: ReactNode }) {
  const { t } = useLangue()
  return (
    <Filet
      titre={t('erreur.titre')}
      texte={t('erreur.texte')}
      recharger={t('erreur.recharger')}
      details={t('erreur.details')}
    >
      {children}
    </Filet>
  )
}
