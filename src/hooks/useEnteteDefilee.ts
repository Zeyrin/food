import { useEffect } from 'react'

/**
 * L'en-tête d'écran est translucide et collée en haut : au repos, un
 * filet sous son titre ne séparerait rien du tout, et une barre qui
 * porte son ombre sur du vide se lit comme un artefact. Le filet et
 * l'ombre n'apparaissent donc qu'à partir du moment où du contenu passe
 * effectivement dessous.
 *
 * L'attribut est posé sur `<html>` plutôt que passé en prop : chaque
 * écran monte sa propre `.entete-app`, et aucun d'eux n'a à savoir où en
 * est le défilement. Le style qui va avec est dans `styles.css`
 * (`html[data-defile='true'] .entete-app`).
 *
 * Seuil bas mais non nul : sur iOS le rebond élastique renvoie des
 * valeurs négatives puis quelques pixels au relâchement, et un seuil à
 * zéro ferait clignoter le filet à chaque geste.
 */
const SEUIL = 8

export function useEnteteDefilee() {
  useEffect(() => {
    let attendu = false

    const appliquer = () => {
      attendu = false
      const defile = window.scrollY > SEUIL
      if (defile) document.documentElement.dataset.defile = 'true'
      else delete document.documentElement.dataset.defile
    }

    // Un seul calcul par frame : `scroll` se déclenche bien plus souvent
    // que le navigateur ne repeint.
    const surDefilement = () => {
      if (attendu) return
      attendu = true
      requestAnimationFrame(appliquer)
    }

    appliquer()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => {
      window.removeEventListener('scroll', surDefilement)
      delete document.documentElement.dataset.defile
    }
  }, [])
}
