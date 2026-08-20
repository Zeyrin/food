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
  prochaineCuisson: Recipe | null
  onVersCuisson: () => void
}

const itemLibreEnListItem = (item: ItemLibre): ListItem => ({
  key: `libre|${item.id}`,
  nom: item.nom,
  quantite: 1,
  unite: 'piece',
  magasin: 'autre',
  origines: [],
})

export default function Liste({ items, etat, onEtat, prochaineCuisson, onVersCuisson }: Props) {
  /**
   * Deux modes sur le même écran. « Tri » remplace l'inventaire du
   * placard : au lieu de tenir un stock à jour toute l'année, on
   * écarte en quinze secondes ce qu'on a déjà, devant le frigo
   * ouvert.
   */
  const [mode, setMode] = useState<'tri' | 'courses'>('tri')

  /**
   * `null` = composeur fermé. Un champ dans la page plutôt qu'un
   * `window.prompt` : la boîte native s'affiche hors de l'app (rendu
   * système, hors thème), coupe le défilement, et surtout ne permet
   * pas d'enchaîner — or on ajoute rarement une seule chose. Ici,
   * « Entrée » valide et laisse le champ ouvert pour la suivante.
   */
  const [saisie, setSaisie] = useState<string | null>(null)

  const itemsLibres = (etat.items ?? []).map(itemLibreEnListItem)
  const tousLesItems = [...items, ...itemsLibres]

  const basculer = (cle: 'coche' | 'dejaPossede', key: string) =>
    onEtat({ ...etat, [cle]: { ...etat[cle], [key]: !etat[cle][key] } })

  const ajouterItem = () => {
    const nom = saisie?.trim()
    if (!nom) return
    const item: ItemLibre = { id: crypto.randomUUID(), nom }
    onEtat({ ...etat, items: [...(etat.items ?? []), item] })
    setSaisie('')
  }

  const retirerItem = (id: string) =>
    onEtat({ ...etat, items: (etat.items ?? []).filter((i) => i.id !== id) })

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="liste" />
        <h1>Liste</h1>
      </div>
    </header>
  )

  const composeur = saisie === null ? null : (
    <form
      className="composeur-item"
      onSubmit={(e) => {
        e.preventDefault()
        ajouterItem()
      }}
    >
      <input
        // Monté seulement à l'ouverture : `autoFocus` ouvre donc bien le
        // clavier au moment du clic sur « + », et pas au chargement.
        autoFocus
        className="champ-texte"
        placeholder="Papier toilette, café…"
        value={saisie}
        enterKeyHint="done"
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setSaisie(null)}
        aria-label="Nom de l'article à ajouter"
      />
      <button
        type="submit"
        className="composeur-valider"
        disabled={!saisie.trim()}
        aria-label="Ajouter à la liste"
      >
        <Icone nom="plus" taille={20} />
      </button>
      <button
        type="button"
        className="bouton-suppr"
        onClick={() => setSaisie(null)}
        aria-label="Fermer l'ajout d'article"
      >
        <Icone nom="fermer" taille={18} />
      </button>
    </form>
  )

  const boutonAjout = (
    <button
      className="bouton-flottant"
      onClick={() => setSaisie((p) => (p === null ? '' : null))}
      aria-expanded={saisie !== null}
      aria-label={saisie === null ? 'Ajouter un article' : "Fermer l'ajout d'article"}
    >
      <Icone nom={saisie === null ? 'plus' : 'fermer'} taille={24} />
    </button>
  )

  if (tousLesItems.length === 0) {
    return (
      <>
        {entete}
        <div className="corps-liste">
          {composeur}
          <p className="vide">La liste se remplit à partir du panier de la semaine.</p>
        </div>
        {boutonAjout}
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
        <div className="corps-liste">
          {bascule}
          {composeur}
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

          {/* Même raison que côté "Liste magasin" : sans cet espaceur, le
              bouton flottant chevauche ce bouton une fois scrollé en bas. */}
          <div className="espaceur-action-flottante" aria-hidden="true" />
        </div>
        {boutonAjout}
      </>
    )
  }

  return (
    <>
      {entete}
      <div className="corps-liste">
        {bascule}
        {composeur}

        <div className="bento-deux-colonnes">
          <div className="carte-resume carte-resume-bento">
            <Icone nom="panier" taille={96} />
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

        {/* Fin des courses — dernière case cochée, ou rien à acheter parce
            qu'on avait déjà tout. Sans ce mot, l'écran ne dit rien de plus
            qu'un compteur arrivé au bout. */}
        {restants === 0 && (
          <div className="carte-fini" role="status">
            <div className="carte-fini-coche" aria-hidden="true">
              <Icone nom="coche" taille={24} />
            </div>
            <div className="carte-fini-texte">
              <h2>{aAcheter.length === 0 ? 'Rien à acheter' : 'Courses terminées'}</h2>
              <p>
                {aAcheter.length === 0
                  ? "Tout ce qu'il faut est déjà dans vos placards."
                  : `Les ${aAcheter.length} produits sont dans le panier.`}
              </p>
            </div>
            {/* La suite du parcours, ici et pas seulement tout en bas de la
                liste : quand la dernière case se coche, on est debout dans
                la file d'attente, pas en train de faire défiler l'écran. */}
            <button className="discret" onClick={onVersCuisson}>
              <Icone nom="grill" taille={18} /> Passer à la cuisson
            </button>
          </div>
        )}

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
                    <span className="nom-groupe">
                      <span className="nom">{item.nom}</span>
                      {item.origines.length > 1 && (
                        <span className="nom-partage">Pour {item.origines.join(', ')}</span>
                      )}
                    </span>
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
          <button className="discret accent" onClick={onVersCuisson}>
            <Icone nom="grill" taille={18} /> Cuisson
          </button>
        </div>

        {/* Sans cet espaceur, le bouton flottant "Ajouter un article"
            (fixe, coin bas-droit) chevauche "Commencer à cuisiner" une
            fois la liste scrollée jusqu'en bas. */}
        <div className="espaceur-action-flottante" aria-hidden="true" />
      </div>

      {boutonAjout}
    </>
  )
}
