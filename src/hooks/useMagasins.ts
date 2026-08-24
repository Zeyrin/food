import { useCallback, useEffect, useState } from 'react'
import type { ConfigMagasins } from '../lib/magasins'
import { CONFIG_PAR_DEFAUT, normaliserConfig } from '../lib/magasins'
import { ecrireMagasins, lireMagasins } from '../lib/local'

/**
 * La config des magasins, lue une fois au démarrage et réécrite à
 * chaque modification. Le défaut (un magasin, tous les rayons) est
 * rendu immédiatement : attendre IndexedDB pour afficher une liste de
 * courses serait un écran blanc au moment où on entre dans le magasin.
 */
export function useMagasins() {
  const [config, setConfig] = useState<ConfigMagasins>(CONFIG_PAR_DEFAUT)

  useEffect(() => {
    void lireMagasins().then(setConfig)
  }, [])

  const definir = useCallback((suivant: ConfigMagasins) => {
    const propre = normaliserConfig(suivant)
    setConfig(propre)
    void ecrireMagasins(propre)
  }, [])

  return { config, definir }
}
