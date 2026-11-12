import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import Paywall from '../components/Paywall'
import { ABONNEMENT_ACTIF, plusEnCache, suivrePlus, verifierPlus } from '../lib/abonnement'
import { mesurer } from '../lib/mesure'
import type { Avantage } from '../lib/offre'

interface ContextePlus {
  /** Abonné FFFood+ — toujours vrai sur le site et sans clé RevenueCat. */
  plus: boolean
  /** L'abonnement existe-t-il ici (app des stores configurée) ? */
  actif: boolean
  /** Montrer l'offre ; `raison` dit quel geste l'a ouverte. */
  ouvrirOffre: (raison?: Avantage) => void
  /** Faire `action` si abonné, sinon montrer l'offre, puis la faire après l'achat. */
  exiger: (raison: Avantage, action: () => void) => void
  definirPlus: (plus: boolean) => void
}

const Contexte = createContext<ContextePlus | null>(null)

export function FournisseurPlus({ children }: { children: ReactNode }) {
  const [plus, setPlus] = useState(plusEnCache)
  const [offre, setOffre] = useState<{ raison?: Avantage; ensuite?: () => void } | null>(null)

  useEffect(() => {
    if (!ABONNEMENT_ACTIF) return
    void verifierPlus().then(setPlus)
    return suivrePlus(setPlus)
  }, [])

  const ouvrirOffre = useCallback((raison?: Avantage) => {
    mesurer('offre_vue', { raison: raison ?? 'reglages' })
    setOffre({ raison })
  }, [])

  const exiger = useCallback(
    (raison: Avantage, action: () => void) => {
      if (plus) return action()
      mesurer('offre_vue', { raison })
      setOffre({ raison, ensuite: action })
    },
    [plus],
  )

  return (
    <Contexte.Provider value={{ plus, actif: ABONNEMENT_ACTIF, ouvrirOffre, exiger, definirPlus: setPlus }}>
      {children}
      {offre && (
        <Paywall
          raison={offre.raison}
          onFermer={() => setOffre(null)}
          onAbonne={() => {
            setPlus(true)
            const ensuite = offre.ensuite
            setOffre(null)
            ensuite?.()
          }}
        />
      )}
    </Contexte.Provider>
  )
}

export function usePlus(): ContextePlus {
  const c = useContext(Contexte)
  if (!c) throw new Error('usePlus hors de FournisseurPlus')
  return c
}
