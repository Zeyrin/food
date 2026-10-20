import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Ce qu'on voit en arrivant par un lien de menu (`#/m/…`) : qui l'envoie,
 * quels plats, et un geste pour les mettre dans son panier. Rien n'est
 * ajouté sans ce geste — on peut avoir déjà composé sa semaine, et un
 * panier qui se remplit tout seul en ouvrant un lien serait une surprise.
 */
interface Props {
  de: string | null
  titres: string[]
  onAjouter: () => void
  onFermer: () => void
}

export default function MenuRecu({ de, titres, onAjouter, onFermer }: Props) {
  const { t } = useLangue()
  const n = titres.length
  const s = n > 1 ? 's' : ''
  return (
    <aside className="bandeau-integre bandeau-invitation" role="status">
      <p>
        <b>{de ? t('menu.recuDe', { de, n, s }) : t('menu.recu', { n, s })}</b> {titres.join(', ')}.
      </p>
      <div className="bandeau-integre-actions">
        <button className="discret accent" onClick={onAjouter}>
          <Icone nom="panier" taille={18} /> {t('menu.ajouter')}
        </button>
        <button className="lien-discret" onClick={onFermer}>
          {t('menu.nonMerci')}
        </button>
      </div>
    </aside>
  )
}
