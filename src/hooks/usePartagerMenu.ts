import { useEffect, useState } from 'react'
import corpus from '../data/recipes.json'
import type { BasketEntry, Recipe } from '../types'
import { useLangue } from '../lib/i18n'
import { lienMenu } from '../lib/menuPartage'
import { mesurer } from '../lib/mesure'
import { partagerOuCopier } from '../lib/natif'

/** Ce que l'autre téléphone connaît à coup sûr : le corpus livré avec l'app. */
const DU_CORPUS = new Set((corpus as Recipe[]).map((r) => r.id))

/** Au-delà, la phrase devient une liste qu'on ne lit plus : le lien montre le reste. */
const TITRES_CITES = 4

/**
 * Envoyer le menu du panier à quelqu'un : la feuille de partage avec les
 * plats nommés et le lien qui les met dans son panier (voir
 * `lib/menuPartage.ts`). Les recettes écrites par la maison restent ici :
 * elles n'existent pas chez celui qui reçoit.
 */
export function usePartagerMenu(basket: BasketEntry[], recipes: Recipe[], prenom: string) {
  const { t } = useLangue()
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (!copie) return
    const minuterie = setTimeout(() => setCopie(false), 2000)
    return () => clearTimeout(minuterie)
  }, [copie])

  const plats = basket.filter((e) => DU_CORPUS.has(e.recipeId))

  const partager = async () => {
    if (plats.length === 0) return
    const titres = plats.map((e) => recipes.find((r) => r.id === e.recipeId)?.titre).filter(Boolean)
    const reste = titres.length - TITRES_CITES
    const cites =
      titres.slice(0, TITRES_CITES).join(', ') + (reste > 0 ? t('menu.etAutres', { n: reste, s: reste > 1 ? 's' : '' }) : '')
    const lien = lienMenu(plats, prenom)
    const texte = prenom.trim()
      ? t('menu.messageDe', { de: prenom.trim(), plats: cites, lien })
      : t('menu.message', { plats: cites, lien })
    try {
      const resultat = await partagerOuCopier(t('menu.titrePartage'), texte)
      if (resultat === 'annule') return
      mesurer('menu_partage', { voie: resultat, plats: plats.length })
      if (resultat === 'copie') setCopie(true)
    } catch {
      window.prompt(t('menu.copierAMain'), texte)
    }
  }

  return { partager, partageable: plats.length > 0, copie }
}
