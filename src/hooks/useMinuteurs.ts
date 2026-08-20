import { useCallback, useEffect, useState } from 'react'
import {
  biper,
  debloquerAudio,
  ecrireMinuteurs,
  lireMinuteurs,
  type Minuteur,
} from '../lib/minuteurs'

/** Horloge partagée : un seul intervalle pour tous les minuteurs. */
function useMaintenant(actif: boolean): number {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    if (!actif) return
    setMaintenant(Date.now())
    const t = setInterval(() => setMaintenant(Date.now()), 500)
    return () => clearInterval(t)
  }, [actif])

  return maintenant
}

export interface Minuteurs {
  /** Triés par heure de fin : le premier de la liste est le prochain à sonner. */
  liste: Minuteur[]
  maintenant: number
  /** Ceux dont l'heure est passée et qui n'ont pas encore été retirés. */
  sonnent: Minuteur[]
  lancer: (secondes: number, nom: string, recipeId: string, recetteTitre: string) => void
  retirer: (id: string) => void
  toutRetirer: () => void
}

/**
 * Monté une fois, tout en haut de l'app : les minuteurs continuent de
 * tourner quel que soit l'écran affiché, et l'alerte part même si on a
 * quitté le mode cuisson entre-temps — c'est justement ce qu'on fait
 * pendant qu'un plat cuit.
 */
export function useMinuteurs(): Minuteurs {
  const [minuteurs, setMinuteurs] = useState<Minuteur[]>(lireMinuteurs)
  const maintenant = useMaintenant(minuteurs.length > 0)

  useEffect(() => ecrireMinuteurs(minuteurs), [minuteurs])

  const liste = [...minuteurs].sort((a, b) => a.fin - b.fin)
  const sonnent = minuteurs.filter((m) => m.fin <= maintenant)

  const lancer = useCallback(
    (secondes: number, nom: string, recipeId: string, recetteTitre: string) => {
      // Débloqué ici (clic = geste utilisateur), pas au moment où le
      // minuteur sonnera réellement — sinon le navigateur bloque le son.
      debloquerAudio()
      const depart = Date.now()
      setMinuteurs((prec) => [
        ...prec,
        { id: crypto.randomUUID(), nom, depart, fin: depart + secondes * 1000, recipeId, recetteTitre },
      ])
    },
    [],
  )

  const retirer = useCallback(
    (id: string) => setMinuteurs((prec) => prec.filter((m) => m.id !== id)),
    [],
  )

  const toutRetirer = useCallback(() => setMinuteurs([]), [])

  // Un bip seul, une vibration seule : trop facile à manquer en
  // cuisine, mains occupées, attention ailleurs. Tant qu'un minuteur
  // sonne sans avoir été retiré, l'alerte se répète — impossible de
  // rater que c'est prêt.
  const yADesTimersQuiSonnent = sonnent.length > 0
  useEffect(() => {
    if (!yADesTimersQuiSonnent) return
    const alerter = () => {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500])
      biper()
    }
    alerter()
    const t = setInterval(alerter, 4000)
    return () => clearInterval(t)
  }, [yADesTimersQuiSonnent])

  return { liste, maintenant, sonnent, lancer, retirer, toutRetirer }
}
