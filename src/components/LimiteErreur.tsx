import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Filet de dernier recours. Sans lui, une erreur de rendu laisse un écran
 * blanc — et le service worker aggrave le cas : il resert le même bundle
 * au rechargement, donc l'écran blanc est *persistant*. L'utilisateur n'a
 * alors aucun moyen de s'en sortir depuis le téléphone.
 *
 * D'où la sortie de secours ci-dessous, qui désinscrit le service worker
 * et vide les caches avant de recharger : elle jette le code, jamais les
 * données. Le panier, la liste et l'historique vivent dans IndexedDB et
 * sur le foyer — on n'y touche pas, sinon le remède coûterait la semaine
 * de courses.
 *
 * Composant de classe parce que React n'expose toujours pas les limites
 * d'erreur aux hooks. Monté *au-dessus* du fournisseur de langue : si
 * c'est lui qui échoue, le filet doit tenir quand même, donc ses textes
 * sont en dur plutôt que passés par `t()`.
 */

const CLE_LANGUE = 'fffood:langue'

const TEXTES = {
  fr: {
    titre: 'Quelque chose a lâché',
    corps:
      "L'app s'est arrêtée sur une erreur. Vos recettes, votre panier et votre liste sont intacts — ils sont enregistrés à part.",
    recharger: 'Recharger',
    reinitialiser: "Réinstaller l'app",
    aide: "Si le rechargement ne suffit pas : « Réinstaller l'app » remet le code à neuf. Vos données ne sont pas touchées.",
    detail: 'Détail technique',
  },
  en: {
    titre: 'Something broke',
    corps:
      'The app stopped on an error. Your recipes, basket and list are intact — they are stored separately.',
    recharger: 'Reload',
    reinitialiser: 'Reinstall the app',
    aide: 'If reloading is not enough: “Reinstall the app” rebuilds the code from scratch. Your data is untouched.',
    detail: 'Technical detail',
  },
}

function langue(): 'fr' | 'en' {
  try {
    return localStorage.getItem(CLE_LANGUE) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

/**
 * Jette le code servi par le cache, garde les données. `reload()` est
 * appelé quoi qu'il arrive : un navigateur sans service worker, ou qui
 * refuse `caches`, doit quand même repartir.
 */
async function reinstaller(): Promise<void> {
  try {
    const inscriptions = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(inscriptions.map((i) => i.unregister()))
  } catch {
    /* pas de service worker, ou API refusée : le rechargement reste utile */
  }
  try {
    const noms = await caches.keys()
    await Promise.all(noms.map((n) => caches.delete(n)))
  } catch {
    /* idem */
  }
  location.reload()
}

interface Etat {
  erreur: Error | null
}

export default class LimiteErreur extends Component<{ children: ReactNode }, Etat> {
  state: Etat = { erreur: null }

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur }
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    // Sur un téléphone, la console est inaccessible ; le message reste
    // affiché dans le repli ci-dessous, sous « Détail technique ».
    console.error('Erreur non rattrapée :', erreur, infos.componentStack)
  }

  render() {
    const { erreur } = this.state
    if (!erreur) return this.props.children

    const t = TEXTES[langue()]

    return (
      <div className="panne" role="alert">
        <h1>{t.titre}</h1>
        <p className="aide">{t.corps}</p>

        <button className="principal" onClick={() => location.reload()}>
          {t.recharger}
        </button>
        <button className="discret suite pleine-largeur" onClick={() => void reinstaller()}>
          {t.reinitialiser}
        </button>

        <p className="aide espace-haut">{t.aide}</p>

        <details className="panne-detail">
          <summary>{t.detail}</summary>
          <pre>{erreur.message}</pre>
        </details>
      </div>
    )
  }
}
