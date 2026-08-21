import { useEffect, useState } from 'react'

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * L'app ne vaut vraiment le coup qu'installée : c'est ce qui lui donne
 * son icône, son plein écran et surtout son cache hors ligne — le
 * magasin est précisément l'endroit où le réseau manque. Rien ne le
 * disait nulle part.
 *
 * Chrome/Android émet `beforeinstallprompt` et laisse déclencher la
 * boîte native quand on veut. iOS ne l'émet pas et n'a pas d'API : là,
 * il n'y a que le geste manuel à expliquer. On distingue donc trois
 * situations plutôt que d'afficher un bouton mort sur iPhone.
 */
export type EtatInstallation = 'installee' | 'possible' | 'manuelle'

export function useInstallation(): {
  etat: EtatInstallation
  installer: () => Promise<void>
} {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null)
  const [installee, setInstallee] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari iOS n'implémente pas `display-mode: standalone` dans
      // matchMedia avant iOS 17 ; ce drapeau non standard reste le seul
      // signal fiable sur les versions plus anciennes.
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  )

  useEffect(() => {
    const surProposition = (e: Event) => {
      // Sans ça, Chrome affiche sa propre barre en bas de page : on
      // préfère un bouton dans les réglages, au moment où on le cherche.
      e.preventDefault()
      setEvenement(e as EvenementInstallation)
    }
    const surInstallation = () => {
      setInstallee(true)
      setEvenement(null)
    }
    window.addEventListener('beforeinstallprompt', surProposition)
    window.addEventListener('appinstalled', surInstallation)
    return () => {
      window.removeEventListener('beforeinstallprompt', surProposition)
      window.removeEventListener('appinstalled', surInstallation)
    }
  }, [])

  const installer = async () => {
    if (!evenement) return
    await evenement.prompt()
    // Un événement consommé ne se rejoue pas : le navigateur en émettra
    // un nouveau si l'utilisateur a refusé et revient plus tard.
    await evenement.userChoice
    setEvenement(null)
  }

  return {
    etat: installee ? 'installee' : evenement ? 'possible' : 'manuelle',
    installer,
  }
}
