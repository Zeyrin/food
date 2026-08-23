import type { Minuteur } from '../lib/minuteurs'
import { mmss } from '../lib/minuteurs'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

interface Props {
  liste: Minuteur[]
  maintenant: number
  onFermer: () => void
  onRetirer: (id: string) => void
  onToutRetirer: () => void
  /**
   * Retour au plat d'où vient un minuteur. Absent quand on y est déjà —
   * proposer « revenir » à l'écran qu'on regarde n'aurait pas de sens.
   */
  onRejoindre?: (recipeId: string) => void
}

/**
 * Feuille ancrée en bas : c'est là que le pouce arrive, et ça laisse
 * l'écran visible au-dessus. Rendue au niveau de l'app, pas du mode
 * cuisson : un minuteur lancé pour un plat se gère depuis n'importe
 * quel écran.
 */
export default function PanneauMinuteurs({
  liste,
  maintenant,
  onFermer,
  onRetirer,
  onToutRetirer,
  onRejoindre,
}: Props) {
  const { t } = useLangue()
  return (
    <>
      <button className="voile-panneau" onClick={onFermer} aria-label={t('panneauMinuteurs.fermer')} />
      <div className="panneau-minuteurs" role="dialog" aria-label={t('panneauMinuteurs.dialogueLabel')}>
        <div className="panneau-minuteurs-entete">
          <h2>{t('panneauMinuteurs.titre')}</h2>
          <button className="cuisson-rond" onClick={onFermer} aria-label={t('panneauMinuteurs.fermer')}>
            <Icone nom="fermer" taille={20} />
          </button>
        </div>

        <ul>
          {liste.map((m) => (
            <li key={m.id} data-sonne={m.fin <= maintenant}>
              <div>
                <b>{m.nom}</b>
                <span>
                  {m.fin <= maintenant
                    ? t('panneauMinuteurs.termine')
                    : mmss(Math.max(0, Math.round((m.fin - maintenant) / 1000)))}
                </span>
                {/* De quel plat il vient : trois minuteurs sans étiquette
                    de recette, c'est trois questions de plus. */}
                {onRejoindre && (
                  <button className="panneau-minuteurs-plat" onClick={() => onRejoindre(m.recipeId)}>
                    {t('panneauMinuteurs.revenirA', { titre: m.recetteTitre })} <Icone nom="suivant" taille={14} />
                  </button>
                )}
              </div>
              {/* Croix identique à celle qui referme la feuille, deux
                  centimètres au-dessus et dans la même colonne : on
                  supprimait un minuteur en croyant fermer le panneau.
                  Celle-ci porte donc la couleur de ce qui se retire. */}
              <button
                className="cuisson-rond cuisson-rond-retrait"
                onClick={() => onRetirer(m.id)}
                aria-label={t('panneauMinuteurs.supprimer', { nom: m.nom })}
              >
                <Icone nom="fermer" taille={18} />
              </button>
            </li>
          ))}
        </ul>

        {liste.length > 1 && (
          <button className="discret suite pleine-largeur panneau-minuteurs-tout" onClick={onToutRetirer}>
            {t('panneauMinuteurs.toutSupprimer')}
          </button>
        )}
      </div>
    </>
  )
}
