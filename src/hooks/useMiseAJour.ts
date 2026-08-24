import { useCallback, useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Le service worker ne cherche une nouvelle version qu'au chargement de
 * la page. Une app installée, elle, n'est presque jamais rechargée : on
 * la sort de l'arrière-plan, on la referme, elle reste des jours sur le
 * même code. D'où ces vérifications supplémentaires — au retour au
 * premier plan, au retour du réseau, et à intervalle régulier tant que
 * l'app est ouverte.
 */
const INTERVALLE_VERIFICATION = 10 * 60 * 1000

/**
 * Fenêtre après le démarrage pendant laquelle une nouvelle version
 * s'installe sans rien demander : quelqu'un qui vient de recharger
 * attend une mise à jour, pas un bandeau à confirmer. Passé ce délai,
 * il est en train de se servir de l'app et on ne lui recharge pas
 * l'écran sous les doigts.
 */
const FENETRE_AUTO = 8000

/** Anti-boucle : deux rechargements automatiques ne s'enchaînent pas. */
const CLE_DERNIERE_AUTO = 'fffood:maj-auto'
const DELAI_ANTI_BOUCLE = 60_000

const DEPART = Date.now()

export type EtatVerification = 'repos' | 'en-cours' | 'a-jour'

export interface MiseAJour {
  /** Une nouvelle version est téléchargée et n'attend qu'un rechargement. */
  disponible: boolean
  verification: EtatVerification
  /** Interroge le serveur maintenant (bouton des réglages). */
  verifier: () => void
  /** Bascule sur la nouvelle version et recharge. */
  appliquer: () => void
}

export function useMiseAJour(): MiseAJour {
  const [disponible, setDisponible] = useState(false)
  const [verification, setVerification] = useState<EtatVerification>('repos')
  const [enregistrement, setEnregistrement] = useState<ServiceWorkerRegistration | null>(null)
  const [appliquerSW, setAppliquerSW] = useState<(() => void) | null>(null)

  useEffect(() => {
    // Trace laissée par `reinitialiserCache()` : elle a fait son travail
    // au chargement, elle n'a pas à rester dans l'URL ni dans un partage.
    const url = new URL(window.location.href)
    if (url.searchParams.has('maj')) {
      url.searchParams.delete('maj')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    }

    const majSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        const derniere = Number(sessionStorage.getItem(CLE_DERNIERE_AUTO) ?? 0)
        const antiBoucle = Date.now() - derniere < DELAI_ANTI_BOUCLE
        // Au démarrage ou app en arrière-plan : personne ne regarde,
        // on bascule tout de suite. C'est le cas qui fait qu'un simple
        // rechargement suffit désormais à voir la dernière version.
        const sansGene =
          document.visibilityState === 'hidden' || Date.now() - DEPART < FENETRE_AUTO
        if (sansGene && !antiBoucle) {
          sessionStorage.setItem(CLE_DERNIERE_AUTO, Date.now().toString())
          void majSW(true)
          return
        }
        setDisponible(true)
        setVerification('repos')
      },
      onRegisteredSW(_url, r) {
        if (r) setEnregistrement(r)
      },
      onRegisterError(erreur) {
        console.error('Service worker non enregistré', erreur)
      },
    })
    setAppliquerSW(() => () => void majSW(true))
  }, [])

  useEffect(() => {
    if (!enregistrement) return

    const verifier = () => {
      if (!navigator.onLine) return
      void enregistrement.update().catch(() => {})
    }
    const surVisibilite = () => {
      if (document.visibilityState === 'visible') verifier()
    }

    const minuterie = window.setInterval(verifier, INTERVALLE_VERIFICATION)
    document.addEventListener('visibilitychange', surVisibilite)
    window.addEventListener('online', verifier)
    return () => {
      window.clearInterval(minuterie)
      document.removeEventListener('visibilitychange', surVisibilite)
      window.removeEventListener('online', verifier)
    }
  }, [enregistrement])

  const verifier = useCallback(() => {
    if (verification === 'en-cours') return
    // Pas de service worker (navigateur qui ne les gère pas, mode dev) :
    // rien à vérifier, la page vient déjà du réseau.
    if (!enregistrement) {
      setVerification('a-jour')
      return
    }
    setVerification('en-cours')
    void enregistrement
      .update()
      .then(async () => {
        // `update()` rend la main dès que le nouveau fichier est reçu,
        // avant que son installation soit finie : sans cette attente on
        // annoncerait « à jour » une seconde avant que la nouvelle
        // version se signale.
        const installation = enregistrement.installing
        if (installation) {
          await new Promise<void>((resoudre) => {
            const surEtat = () => {
              if (installation.state === 'installed' || installation.state === 'redundant') {
                installation.removeEventListener('statechange', surEtat)
                resoudre()
              }
            }
            installation.addEventListener('statechange', surEtat)
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        setVerification((etat) => (etat === 'en-cours' ? 'a-jour' : etat))
      })
  }, [enregistrement, verification])

  const appliquer = useCallback(() => {
    if (appliquerSW) {
      sessionStorage.setItem(CLE_DERNIERE_AUTO, Date.now().toString())
      appliquerSW()
    } else {
      window.location.reload()
    }
  }, [appliquerSW])

  return { disponible, verification, verifier, appliquer }
}
