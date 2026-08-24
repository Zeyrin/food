import { useState } from 'react'
import type { Recipe } from '../types'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'
import FormulaireRecette from './FormulaireRecette'
import CollageIA from './CollageIA'

/**
 * L'ajout d'une recette, tel qu'il s'ouvre dans l'écran « Proposer ».
 *
 * Ce n'était pas un écran clair : un cinquième onglet menait à un
 * champ de texte attendant du JSON, sans dire d'où ce JSON devait
 * venir. On commence donc par la seule question que l'utilisateur se
 * pose vraiment — « je l'écris, ou je la fais écrire ? » — et chaque
 * réponse mène à un chemin qui se suffit à lui-même.
 */
interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  onFerme: () => void
  titresExistants: string[]
  tagsConnus: string[]
}

type Methode = 'main' | 'ia'

export default function AjoutRecette({ onAjouter, onFerme, titresExistants, tagsConnus }: Props) {
  const { t } = useLangue()
  const [methode, setMethode] = useState<Methode | null>(null)
  /** Ce qui vient d'entrer au catalogue, une fois le chemin terminé. */
  const [bilan, setBilan] = useState<{ nombre: number; titre?: string } | null>(null)

  const recommencer = () => {
    setBilan(null)
    setMethode(null)
  }

  return (
    <section className="panneau-ajout" aria-label={t('ajouter.sectionTitre')}>
      <div className="panneau-ajout-entete">
        <div className="entete-app-titre">
          <Icone nom="plus-cercle" taille={22} />
          <h2>{t('ajouter.sectionTitre')}</h2>
        </div>
        <button
          className="bouton-rond-discret"
          onClick={onFerme}
          aria-label={t('ajouter.fermerSection')}
        >
          <Icone nom="fermer" taille={18} />
        </button>
      </div>

      {bilan !== null ? (
        <>
          <div className="bloc-succes" role="status">
            <Icone nom="coche" taille={22} />
            <p>
              {bilan.nombre > 1
                ? t('ajouter.succesPlusieurs', { n: bilan.nombre })
                : t('ajouter.succesUne', { titre: bilan.titre ?? '' })}
            </p>
          </div>
          <p className="aide-champ">{t('ajouter.succesTexte')}</p>
          <div className="actions-formulaire">
            <button className="principal" onClick={recommencer}>
              {t('ajouter.enAjouterUneAutre')}
            </button>
            <button className="discret suite pleine-largeur" onClick={onFerme}>
              {t('ajouter.voirLeCatalogue')}
            </button>
          </div>
        </>
      ) : methode === null ? (
        <>
          <p className="aide">{t('ajouter.choixTitre')}</p>
          <div className="choix-methodes">
            <button className="carte-methode" onClick={() => setMethode('main')}>
              <span className="carte-methode-rond">
                <Icone nom="crayon" taille={22} />
              </span>
              <b>{t('ajouter.choixMainTitre')}</b>
              <em>{t('ajouter.choixMainTexte')}</em>
            </button>
            <button className="carte-methode" onClick={() => setMethode('ia')}>
              <span className="carte-methode-rond">
                <Icone nom="etincelle" taille={22} />
              </span>
              <b>{t('ajouter.choixIaTitre')}</b>
              <em>{t('ajouter.choixIaTexte')}</em>
            </button>
          </div>
        </>
      ) : methode === 'main' ? (
        <FormulaireRecette
          titresExistants={titresExistants}
          tagsConnus={tagsConnus}
          onValider={async (recette) => {
            await onAjouter(recette)
            setBilan({ nombre: 1, titre: recette.titre })
          }}
          onAnnuler={() => setMethode(null)}
          libelleAnnuler={t('ajouter.retourAuChoix')}
        />
      ) : (
        <CollageIA
          titresExistants={titresExistants}
          onAjouter={onAjouter}
          onFini={(nombre) => setBilan({ nombre })}
          onRetour={() => setMethode(null)}
        />
      )}
    </section>
  )
}
