import { useState } from 'react'
import type { Recipe } from '../types'
import { useLangue } from '../lib/i18n'
import { ajouteeParLeFoyer } from '../lib/favoris'
import { teinteRecette } from '../lib/identite'
import type { Historique } from '../lib/propose'
import { titreRecette } from '../lib/traduireRecette'
import Icone from '../components/Icone'

/**
 * Le profil : un prénom (propre à l'appareil — pas de compte) et la
 * collection de recettes du foyer. La collection réunit ce que
 * `lib/favoris.ts` appelle déjà favoris : les recettes ajoutées par le
 * foyer, importées d'un lien ou écrites, et les plats notés « À refaire ».
 */
interface Props {
  prenom: string
  onPrenom: (prenom: string) => void
  /** Les favoris du foyer, déjà filtrés (voir `favoris()`). */
  collection: Recipe[]
  historique: Historique
  onDetail: (recipeId: string) => void
  onAjouter: () => void
  onFermer: () => void
}

type Filtre = 'toutes' | 'importees' | 'maison' | 'refaire'

const hoteDe = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function Profil({
  prenom,
  onPrenom,
  collection,
  historique,
  onDetail,
  onAjouter,
  onFermer,
}: Props) {
  const { t, langue } = useLangue()
  const [filtre, setFiltre] = useState<Filtre>('toutes')

  const importee = (r: Recipe) => !!r.source
  const maison = (r: Recipe) => ajouteeParLeFoyer(r) && !r.source
  const refaire = (r: Recipe) => historique.verdicts[r.id] === 'refaire'

  const compte: Record<Filtre, number> = {
    toutes: collection.length,
    importees: collection.filter(importee).length,
    maison: collection.filter(maison).length,
    refaire: collection.filter(refaire).length,
  }
  const filtres = (['toutes', 'importees', 'maison', 'refaire'] as const).filter(
    (f) => f === 'toutes' || compte[f] > 0,
  )
  const affichees = collection.filter(
    (r) =>
      filtre === 'toutes' ||
      (filtre === 'importees' && importee(r)) ||
      (filtre === 'maison' && maison(r)) ||
      (filtre === 'refaire' && refaire(r)),
  )
  const cuisines = Object.keys(historique.derniereFois).length

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="profil" />
          <h1>{t('profil.titre')}</h1>
        </div>
        <button className="bouton-rond-discret" onClick={onFermer} aria-label={t('profil.fermer')}>
          <Icone nom="fermer" taille={20} />
        </button>
      </header>

      <section className="carte profil-identite">
        <span className="profil-avatar" aria-hidden="true">
          {(prenom.trim()[0] ?? '').toUpperCase() || <Icone nom="profil" taille={26} />}
        </span>
        <label className="profil-prenom">
          <span>{t('profil.prenom')}</span>
          <input
            className="champ-texte"
            value={prenom}
            maxLength={30}
            placeholder={t('profil.prenomPlaceholder')}
            onChange={(e) => onPrenom(e.target.value)}
          />
        </label>
      </section>

      <div className="profil-stats">
        <div>
          <b>{collection.length}</b>
          <span>{t('profil.statCollection')}</span>
        </div>
        <div>
          <b>{cuisines}</b>
          <span>{t('profil.statCuisines')}</span>
        </div>
        <div>
          <b>{compte.importees}</b>
          <span>{t('profil.statImportees')}</span>
        </div>
      </div>

      <h2>{t('profil.collectionTitre')}</h2>

      {collection.length === 0 ? (
        <div className="carte profil-vide">
          <p className="aide">{t('profil.collectionVide')}</p>
          <button className="principal suite" onClick={onAjouter}>
            <Icone nom="plus" taille={18} /> {t('profil.ajouter')}
          </button>
        </div>
      ) : (
        <>
          {filtres.length > 1 && (
            <div className="puces" role="group" aria-label={t('profil.filtres')}>
              {filtres.map((f) => (
                <button
                  key={f}
                  className="puce"
                  aria-pressed={filtre === f}
                  onClick={() => setFiltre(f)}
                >
                  {t(`profil.filtre.${f}`)} · {compte[f]}
                </button>
              ))}
            </div>
          )}
          <ul className="profil-collection">
            {affichees.map((r) => (
              <li key={r.id}>
                <button
                  className="carte profil-recette"
                  style={{ '--teinte': teinteRecette(r.titre) } as React.CSSProperties}
                  onClick={() => onDetail(r.id)}
                >
                  <span className="profil-recette-pastille" aria-hidden="true" />
                  <span className="profil-recette-texte">
                    <b>{titreRecette(r, langue)}</b>
                    <em>
                      {t('detail.minutes', { n: r.temps })}
                      {r.source ? ` · ${hoteDe(r.source)}` : ''}
                      {refaire(r) ? ` · ${t('profil.aRefaire')}` : ''}
                    </em>
                  </span>
                  <Icone nom={r.source ? 'lien' : 'coeur'} taille={16} />
                </button>
              </li>
            ))}
          </ul>
          <button className="discret suite pleine-largeur" onClick={onAjouter}>
            <Icone nom="plus" taille={18} /> {t('profil.ajouter')}
          </button>
        </>
      )}
    </>
  )
}
