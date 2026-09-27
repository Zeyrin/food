import { useState } from 'react'
import { lienMaison, navigateurIntegre } from '../lib/navigateurIntegre'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

const CLE_MASQUE = 'fffood:integre-masque'

/**
 * Dans la vue web d'Instagram ou de TikTok, la maison qu'on vient de
 * créer n'existera pas dans Safari ou Chrome (voir
 * `lib/navigateurIntegre.ts`). Le lien de la maison, lui, traverse : on
 * propose de le copier, pour le coller dans le vrai navigateur et y
 * retrouver sa semaine telle quelle. Masquable, et masqué pour de bon —
 * c'est un conseil, pas un obstacle.
 */
export default function BandeauIntegre({ foyer }: { foyer: string }) {
  const { t } = useLangue()
  const app = navigateurIntegre()
  const [masque, setMasque] = useState(() => {
    try {
      return localStorage.getItem(CLE_MASQUE) === '1'
    } catch {
      return false
    }
  })
  const [copie, setCopie] = useState(false)

  if (!app || masque) return null

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lienMaison(foyer))
      setCopie(true)
    } catch {
      // Presse-papiers refusé (certaines vues web) : on montre le lien à
      // la place, sélectionnable à la main.
      window.prompt(t('integre.copier'), lienMaison(foyer))
    }
  }

  const masquer = () => {
    try {
      localStorage.setItem(CLE_MASQUE, '1')
    } catch {
      /* navigation privée stricte : il reviendra au prochain lancement */
    }
    setMasque(true)
  }

  return (
    <aside className="bandeau-integre" role="note">
      <p>{t('integre.texte', { app })}</p>
      <div className="bandeau-integre-actions">
        <button className="discret accent" onClick={() => void copier()} disabled={copie}>
          <Icone nom={copie ? 'coche' : 'copier'} taille={18} /> {copie ? t('integre.copie') : t('integre.copier')}
        </button>
        <button className="lien-discret" onClick={masquer}>
          {t('integre.fermer')}
        </button>
      </div>
    </aside>
  )
}
