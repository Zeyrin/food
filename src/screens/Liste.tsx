import { useState } from 'react'
import type { ItemLibre, ListItem, ListState, Recipe } from '../types'
import { STORES } from '../types'
import { formatQuantite, groupByStore } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  items: ListItem[]
  etat: ListState
  onEtat: (etat: ListState) => void
  foyer: string | null
  prochaineCuisson: Recipe | null
}

const itemLibreEnListItem = (item: ItemLibre): ListItem => ({
  key: `libre|${item.id}`,
  nom: item.nom,
  quantite: 1,
  unite: 'piece',
  magasin: 'autre',
  origines: [],
})

export default function Liste({ items, etat, onEtat, foyer, prochaineCuisson }: Props) {
  /**
   * Deux modes sur le même écran. « Tri » remplace l'inventaire du
   * placard : au lieu de tenir un stock à jour toute l'année, on
   * écarte en quinze secondes ce qu'on a déjà, devant le frigo
   * ouvert.
   */
  const [mode, setMode] = useState<'tri' | 'courses'>('tri')

  const itemsLibres = (etat.items ?? []).map(itemLibreEnListItem)
  const tousLesItems = [...items, ...itemsLibres]

  const basculer = (cle: 'coche' | 'dejaPossede', key: string) =>
    onEtat({ ...etat, [cle]: { ...etat[cle], [key]: !etat[cle][key] } })

  const ajouterItem = () => {
    const nom = window.prompt('Ajouter à la liste :')?.trim()
    if (!nom) return
    const item: ItemLibre = { id: crypto.randomUUID(), nom }
    onEtat({ ...etat, items: [...(etat.items ?? []), item] })
  }

  const retirerItem = (id: string) =>
    onEtat({ ...etat, items: (etat.items ?? []).filter((i) => i.id !== id) })

  const partager = async () => {
    if (!foyer) return
    const lien = `${location.origin}/#/f/${foyer}`
    if (navigator.share) await navigator.share({ title: 'Liste de courses', url: lien })
    else await navigator.clipboard.writeText(lien)
  }

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="liste" />
        <h1>Liste</h1>
      </div>
    </header>
  )

  if (tousLesItems.length === 0) {
    return (
      <>
        {entete}
        <p className="vide">La liste se remplit à partir du panier de la semaine.</p>
        <button className="bouton-flottant" onClick={ajouterItem} aria-label="Ajouter un article">
          <Icone nom="plus" taille={24} />
        </button>
      </>
    )
  }

  const aAcheter = tousLesItems.filter((i) => !etat.dejaPossede[i.key])
  const restants = aAcheter.filter((i) => !etat.coche[i.key]).length

  const bascule = (
    <div className="bascule-mode">
      <button className="bascule-mode-bouton" aria-pressed={mode === 'tri'} onClick={() => setMode('tri')}>
        Ce que j'ai déjà
      </button>
      <button
        className="bascule-mode-bouton"
        aria-pressed={mode === 'courses'}
        onClick={() => setMode('courses')}
      >
        Liste magasin
      </button>
    </div>
  )

  if (mode === 'tri') {
    return (
      <>
        {entete}
        {bascule}
        <p className="aide">
          Ouvrez le frigo et le placard, touchez ce qui est déjà là. Le reste part en courses.
        </p>

        {tousLesItems.map((item) => {
          const deja = etat.dejaPossede[item.key] === true
          return (
            <button
              className="rangee"
              key={item.key}
              data-coche={deja}
              onClick={() => basculer('dejaPossede', item.key)}
            >
              <span className="case">{deja && <Icone nom="coche" taille={18} />}</span>
              <span className="nom">{item.nom}</span>
              <span className="qte">{formatQuantite(item)}</span>
            </button>
          )
        })}

        <button className="principal" onClick={() => setMode('courses')}>
          Passer aux courses ({aAcheter.length} produits)
        </button>
        <button className="bouton-flottant" onClick={ajouterItem} aria-label="Ajouter un article">
          <Icone nom="plus" taille={24} />
        </button>
      </>
    )
  }

  return (
    <>
      {entete}
      {bascule}

      <div className="bento-deux-colonnes">
        <div className="carte-resume carte-resume-bento">
          <Icone nom="panier-plein" taille={96} />
          <p className="carte-resume-label">Progression</p>
          <h2 className="carte-resume-nombre">
            {aAcheter.length - restants} <span>/ {aAcheter.length}</span>
          </h2>
        </div>
        {prochaineCuisson && (
          <div
            className="carte-prochaine-cuisson"
            style={{ '--teinte': teinteRecette(prochaineCuisson.titre) } as React.CSSProperties}
          >
            <p className="carte-resume-label">Prochaine cuisson</p>
            <p className="carte-prochaine-cuisson-titre">{prochaineCuisson.titre}</p>
          </div>
        )}
      </div>

      {groupByStore(aAcheter).map(({ magasin, items: lignes }) => (
        <section key={magasin}>
          <h2 className="entete-section">
            <span className="badge-section" data-magasin={magasin}>
              <Icone nom={STORES[magasin].icone} taille={20} />
            </span>
            {STORES[magasin].label}
          </h2>
          {lignes.map((item) => {
            const coche = etat.coche[item.key] === true
            const libre = item.magasin === 'autre'
            return (
              <div className="rangee-avec-suppr" key={item.key}>
                <button className="rangee" data-coche={coche} onClick={() => basculer('coche', item.key)}>
                  <span className="case">{coche && <Icone nom="coche" taille={18} />}</span>
                  <span className="nom">{item.nom}</span>
                  {!libre && <span className="qte">{formatQuantite(item)}</span>}
                </button>
                {libre && (
                  <button
                    className="bouton-suppr"
                    onClick={() => retirerItem(item.key.replace('libre|', ''))}
                    aria-label={`Retirer ${item.nom}`}
                  >
                    <Icone nom="fermer" taille={16} />
                  </button>
                )}
              </div>
            )
          })}
        </section>
      ))}

      <div className="rangee-boutons espace-haut">
        <button className="discret" onClick={() => setMode('tri')}>
          Revoir le tri
        </button>
        <button className="discret" onClick={partager} disabled={!foyer}>
          Partager la liste
        </button>
      </div>

      <button className="bouton-flottant" onClick={ajouterItem} aria-label="Ajouter un article">
        <Icone nom="plus" taille={24} />
      </button>
    </>
  )
}
