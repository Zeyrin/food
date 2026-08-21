import { useState } from 'react'

/**
 * La photo d'une recette, quand il y en a une. Elle recouvre la vignette
 * teintée qui sert de repli : si l'image ne charge pas, on la retire et la
 * vignette réapparaît — sinon le navigateur laissait un cadre vide à la
 * place du plat. Le repli sert surtout aux recettes ajoutées depuis l'app,
 * qui n'ont pas de photo : celles du corpus sont livrées avec le build
 * (`public/plats/`) et précachées, elles tiennent hors ligne.
 *
 * `loading="lazy"` parce que la grille affiche tout le catalogue d'un
 * coup : rien ne justifie de télécharger la vingtième photo avant que
 * l'écran n'y arrive.
 */
export default function ImageRecette({ src }: { src?: string }) {
  const [cassee, setCassee] = useState(false)
  if (!src || cassee) return null
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setCassee(true)} />
}
