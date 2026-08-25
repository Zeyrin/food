import { useEffect } from 'react'

/**
 * Sur Safari iOS, la barre d'outils du bas (URL, onglets) fait partie
 * du chrome du navigateur : elle se dessine par-dessus la page, mais
 * `position: fixed; bottom: 0` s'appuie sur le viewport de mise en
 * page, qui ne rétrécit pas quand elle apparaît. Résultat, le rail
 * d'onglets et les boutons flottants se retrouvent cachés dessous.
 * `env(safe-area-inset-bottom)` ne couvre que l'encoche/l'indicateur
 * d'accueil, pas cette barre-là.
 *
 * `visualViewport` connaît la vraie zone visible : l'écart avec la
 * hauteur du viewport de mise en page est exactement ce que la barre
 * d'outils masque en ce moment. On l'expose en variable CSS, utilisée
 * en plus de `env(safe-area-inset-bottom)` par les éléments collés en
 * bas — 0 partout ailleurs (desktop, Android, PWA installée en plein
 * écran), donc aucun effet sur ces plateformes.
 */
export function useDecalageBarreOutils() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    let pose = -1

    const mettreAJour = () => {
      frame = 0
      const decalage = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      // Pendant un défilement à l'inertie, la barre d'outils passe la
      // plupart du temps à la même hauteur : réécrire la variable à
      // l'identique invaliderait quand même le style de tout le document,
      // à chaque événement, pour rien.
      if (decalage === pose) return
      pose = decalage
      document.documentElement.style.setProperty('--decalage-barre-outils', `${decalage}px`)
    }

    // `visualViewport` émet ses événements bien plus souvent que le
    // navigateur ne dessine — un par image suffit, et c'est le seul
    // moment où la valeur peut se voir.
    const planifier = () => {
      if (frame) return
      frame = requestAnimationFrame(mettreAJour)
    }

    mettreAJour()
    vv.addEventListener('resize', planifier)
    vv.addEventListener('scroll', planifier)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      vv.removeEventListener('resize', planifier)
      vv.removeEventListener('scroll', planifier)
    }
  }, [])
}
