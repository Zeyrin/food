import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Une nouvelle version est en cache et attend d'être servie.
 *
 * Le service worker était en `autoUpdate` : il prenait la main et
 * rechargeait la page tout seul, ce qui peut tomber au pire moment —
 * debout dans le rayon, au milieu d'une liste à moitié cochée. Rien
 * n'était perdu (tout vit dans IndexedDB et sur le foyer), mais l'écran
 * sautait sans explication.
 *
 * Le choix revient donc à l'utilisateur, et le bandeau ne bloque rien :
 * ignoré, l'app continue sur l'ancienne version et la nouvelle sera
 * servie au prochain lancement.
 */
export default function BandeauMiseAJour() {
  const { t } = useLangue()
  const {
    needRefresh: [aJour, setAJour],
    updateServiceWorker,
  } = useRegisterSW()

  if (!aJour) return null

  return (
    <div className="bandeau-maj" role="status">
      <p>{t('maj.texte')}</p>
      <div className="bandeau-maj-actions">
        <button className="discret" onClick={() => setAJour(false)}>
          {t('maj.plusTard')}
        </button>
        <button className="discret accent" onClick={() => void updateServiceWorker(true)}>
          <Icone nom="coche" taille={16} /> {t('maj.recharger')}
        </button>
      </div>
    </div>
  )
}
