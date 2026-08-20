import { useCallback, useEffect, useRef, useState } from 'react'
import {
  biper,
  debloquerAudio,
  demanderNotifications,
  ecrireMinuteurs,
  fermerNotifications,
  lireMinuteurs,
  notifierMinuteur,
  type Minuteur,
} from '../lib/minuteurs'

/** Horloge partagée : un seul intervalle pour tous les minuteurs. */
function useMaintenant(actif: boolean): number {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    if (!actif) return
    setMaintenant(Date.now())
    const t = setInterval(() => setMaintenant(Date.now()), 500)
    // En arrière-plan, le navigateur ralentit l'intervalle jusqu'à un par
    // minute : au retour, le décompte affiché aurait pu être faux pendant
    // une minute entière. On le remet à l'heure aux deux transitions — au
    // retour pour l'affichage, au départ pour que le minuteur déjà écoulé
    // parte en notification tout de suite plutôt qu'au prochain tic ralenti.
    const surBascule = () => setMaintenant(Date.now())
    document.addEventListener('visibilitychange', surBascule)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', surBascule)
    }
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
      // Même raison de calendrier : la permission de notifier se demande
      // sur un geste, et celui-ci dit exactement « préviens-moi ».
      demanderNotifications()
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

  // Le bip et la vibration ne sortent pas de l'app : téléphone
  // verrouillé ou autre application au premier plan, ils sont suspendus.
  // Une notification système, si. Une seule par minuteur — le `ref`
  // évite qu'elle ne se rejoue à chaque tic d'horloge.
  const notifies = useRef(new Set<string>())
  useEffect(() => {
    if (!document.hidden) return
    for (const m of sonnent) {
      if (notifies.current.has(m.id)) continue
      notifies.current.add(m.id)
      notifierMinuteur(m)
    }
  }, [sonnent])

  // De retour dans l'app, le bandeau dit tout ce qu'il faut : les
  // notifications n'ont plus lieu d'être, et un minuteur relancé plus
  // tard doit pouvoir en produire une nouvelle.
  useEffect(() => {
    const surRetour = () => {
      if (document.hidden) return
      fermerNotifications()
      notifies.current.clear()
    }
    document.addEventListener('visibilitychange', surRetour)
    return () => document.removeEventListener('visibilitychange', surRetour)
  }, [])

  return { liste, maintenant, sonnent, lancer, retirer, toutRetirer }
}
