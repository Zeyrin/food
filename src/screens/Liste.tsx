import { useState } from 'react'
import type { ListItem, ListState } from '../types'
import { STORES } from '../types'
import { formatQuantite, groupByStore } from '../lib/aggregate'
import Icone from '../components/Icone'

interface Props {
  items: ListItem[]
  etat: ListState
  onEtat: (etat: ListState) => void
  foyer: string | null
}

export default function Liste({ items, etat, onEtat, foyer }: Props) {
  /**
   * Deux modes sur le même écran. « Tri » remplace l'inventaire du
   * placard : au lieu de tenir un stock à jour toute l'année, on
   * écarte en quinze secondes ce qu'on a déjà, devant le frigo
   * ouvert.
   */
  const [mode, setMode] = useState<'tri' | 'courses'>('tri')

  const basculer = (cle: keyof ListState, key: string) =>
    onEtat({ ...etat, [cle]: { ...etat[cle], [key]: !etat[cle][key] } })

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

  if (items.length === 0) {
    return (
      <>
        {entete}
        <p className="vide">La liste se remplit à partir du panier de la semaine.</p>
      </>
    )
  }

  const aAcheter = items.filter((i) => !etat.dejaPossede[i.key])
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

        {items.map((item) => {
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
      </>
    )
  }

  return (
    <>
      {entete}
      {bascule}

      <div className="carte-resume">
        <p className="carte-resume-label">Progression</p>
        <h2 className="carte-resume-nombre">
          {aAcheter.length - restants} <span>/ {aAcheter.length}</span>
        </h2>
      </div>

      {groupByStore(aAcheter).map(({ magasin, items: lignes }) => (
        <section key={magasin}>
          <h2>
            <span className="etiquette" data-magasin={magasin}>
              {STORES[magasin].label}
            </span>
          </h2>
          {lignes.map((item) => {
            const coche = etat.coche[item.key] === true
            return (
              <button
                className="rangee"
                key={item.key}
                data-coche={coche}
                onClick={() => basculer('coche', item.key)}
              >
                <span className="case">{coche && <Icone nom="coche" taille={18} />}</span>
                <span className="nom">{item.nom}</span>
                <span className="qte">{formatQuantite(item)}</span>
              </button>
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
    </>
  )
}
