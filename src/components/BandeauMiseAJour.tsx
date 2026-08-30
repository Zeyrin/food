import Icone from './Icone'
import { useLangue } from '../lib/i18n'

interface Props {
  onAppliquer: () => void
  onPlusTard: () => void
}

/**
 * Une nouvelle version est déjà téléchargée et n'attend qu'un
 * rechargement. On le propose au lieu de l'imposer : recharger pendant
 * qu'on suit une recette ou qu'on coche sa liste en rayon, c'est perdre
 * sa place. Le panier, la liste et les minuteurs sont conservés — seul
 * l'écran repart d'en haut.
 */
export default function BandeauMiseAJour({ onAppliquer, onPlusTard }: Props) {
  const { t } = useLangue()
  return (
    <div className="bandeau-maj" role="status">
      <span className="bandeau-maj-texte">
        <Icone nom="rafraichir" taille={18} />
        {t('bandeauMaj.disponible')}
      </span>
      <span className="bandeau-maj-actions">
        <button className="bandeau-maj-plus-tard" onClick={onPlusTard}>
          {t('bandeauMaj.plusTard')}
        </button>
        <button className="bandeau-maj-appliquer" onClick={onAppliquer}>
          {t('bandeauMaj.mettreAJour')}
        </button>
      </span>
    </div>
  )
}
