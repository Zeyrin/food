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

    const mettreAJour = () => {
      const decalage = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--decalage-barre-outils', `${decalage}px`)
    }

    mettreAJour()
    vv.addEventListener('resize', mettreAJour)
    vv.addEventListener('scroll', mettreAJour)
    return () => {
      vv.removeEventListener('resize', mettreAJour)
      vv.removeEventListener('scroll', mettreAJour)
    }
  }, [])
}
