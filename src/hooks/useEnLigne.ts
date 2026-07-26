import { useEffect, useState } from 'react'

/**
 * En magasin, le réseau coupe sans prévenir. `navigator.onLine` ne
 * détecte que l'absence d'interface réseau (avion, pas de wifi), pas
 * un signal faible sans débit — mais c'est déjà le cas qui compte :
 * rassurer que rien ne se perd quand le téléphone sait qu'il est
 * hors ligne.
 */
export function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(navigator.onLine)

  useEffect(() => {
    const surChangement = () => setEnLigne(navigator.onLine)
    window.addEventListener('online', surChangement)
    window.addEventListener('offline', surChangement)
    return () => {
      window.removeEventListener('online', surChangement)
      window.removeEventListener('offline', surChangement)
    }
  }, [])

  return enLigne
}
