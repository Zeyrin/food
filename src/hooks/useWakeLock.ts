import { useEffect } from 'react'

/**
 * Garde l'écran allumé pendant la cuisson. Le verrou saute dès que
 * l'onglet passe en arrière-plan, d'où la reprise sur
 * `visibilitychange`. Non supporté sur Safari < 16.4 : on laisse
 * filer, la cuisine se fait juste avec un écran qui s'éteint.
 */
export function useWakeLock(actif: boolean): void {
  useEffect(() => {
    if (!actif || !('wakeLock' in navigator)) return

    let verrou: WakeLockSentinel | null = null
    let annule = false

    const prendre = async () => {
      try {
        verrou = await navigator.wakeLock.request('screen')
      } catch {
        /* refusé par le navigateur ou batterie faible */
      }
    }

    const surVisibilite = () => {
      if (document.visibilityState === 'visible' && !annule) void prendre()
    }

    void prendre()
    document.addEventListener('visibilitychange', surVisibilite)

    return () => {
      annule = true
      document.removeEventListener('visibilitychange', surVisibilite)
      void verrou?.release()
    }
  }, [actif])
}
