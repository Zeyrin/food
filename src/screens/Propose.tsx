import { useMemo, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { type Historique, proposer, tousLesTags } from '../lib/propose'
import { teinteRecette } from '../lib/identite'
import Icone from '../components/Icone'

interface Props {
  recipes: Recipe[]
  historique: Historique
  basket: BasketEntry[]
  onBasket: (basket: BasketEntry[]) => void
  onDetail: (recipeId: string) => void
}

const TEMPS = [20, 30, 45] as const

const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

export default function Propose({ recipes, historique, basket, onBasket, onDetail }: Props) {
  const [recherche, setRecherche] = useState('')
  /**
   * Le tiroir de filtres est une colonne latérale sur desktop (il y a la
   * place, il reste ouvert), mais sur un téléphone le nuage de tags fait
   * une pleine hauteur d'écran : ouvert par défaut, il repoussait toutes
   * les recettes sous la ligne de flottaison. On atterrit donc sur le
   * catalogue, les filtres à un doigt — leur nombre s'affiche sur le
   * résumé replié.
   */
  const [filtresOuverts, setFiltresOuverts] = useState(
    () => window.matchMedia('(min-width: 900px)').matches,
  )
  const [tempsMax, setTempsMax] = useState<number | null>(null)
  const [aRefaire, setARefaire] = useState(false)
  const [tags, setTags] = useState<string[]>([])

  // Tout le catalogue d'un coup (pas de limite à 8) : `proposer` sert
  // encore pour l'ordre — le rejeté disparaît, le récent descend, le
  // « à refaire » remonte.
  //
  // La recherche regarde aussi les ingrédients : on tape rarement le
  // titre d'un plat qu'on ne connaît pas encore, on tape « aubergine »
  // parce qu'il y en a une à finir. `motifs` retient l'ingrédient qui a
  // fait correspondre la recette, pour l'afficher sur la carte — sinon
  // « Dahl de lentilles » remonté par « coco » ressemble à un bug.
  const { affichees, motifs } = useMemo(() => {
    let liste = proposer(recipes, historique, {
      tempsMax: tempsMax ?? undefined,
      tags,
      nombre: recipes.length,
    })
    if (aRefaire) liste = liste.filter((r) => historique.verdicts[r.id] === 'refaire')

    const motifs = new Map<string, string>()
    if (recherche.trim()) {
      const q = normaliser(recherche)
      liste = liste.filter((r) => {
        if (normaliser(r.titre).includes(q)) return true
        const ing = r.ingredients.find((i) => normaliser(i.nom).includes(q))
        if (ing) {
          motifs.set(r.id, ing.nom)
          return true
        }
        const tag = r.tags.find((t) => normaliser(t).includes(q))
        if (tag) {
          motifs.set(r.id, tag)
          return true
        }
        return false
      })
    }
    return { affichees: liste, motifs }
  }, [recipes, historique, tempsMax, tags, aRefaire, recherche])

  const dansPanier = (id: string) => basket.some((e) => e.recipeId === id)

  const basculer = (recette: Recipe) => {
    onBasket(
      dansPanier(recette.id)
        ? basket.filter((e) => e.recipeId !== recette.id)
        : [...basket, { recipeId: recette.id, portions: recette.portions }],
    )
  }

  const basculerTag = (t: string) =>
    setTags((prec) => (prec.includes(t) ? prec.filter((x) => x !== t) : [...prec, t]))

  const nombreFiltres = (tempsMax !== null ? 1 : 0) + (aRefaire ? 1 : 0) + tags.length

  const toutEffacer = () => {
    setTempsMax(null)
    setARefaire(false)
    setTags([])
    setRecherche('')
  }

  return (
    <div className="ecran-propose">
      <header className="entete-app entete-propose">
        <div className="entete-app-titre">
          <Icone nom="grill" />
          <h1>Proposer</h1>
        </div>
        <div className="recherche-propose" data-tour="recherche-propose">
          <Icone nom="recherche" taille={18} />
          <input
            className="champ-texte champ-recherche"
            type="search"
            placeholder="Un plat, un ingrédient…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Chercher un plat ou un ingrédient"
          />
          {/* La croix native de `type=search` n'existe pas partout (ni sur
              Firefox, ni sur iOS) : sans elle, effacer demande d'ouvrir le
              clavier et de maintenir « retour arrière ». */}
          {recherche && (
            <button
              className="bouton-effacer-recherche"
              onClick={() => setRecherche('')}
              aria-label="Effacer la recherche"
            >
              <Icone nom="fermer" taille={16} />
            </button>
          )}
        </div>
      </header>

      <div className="corps-propose">
        <details
          className="tiroir-filtres"
          open={filtresOuverts}
          onToggle={(e) => setFiltresOuverts(e.currentTarget.open)}
          data-tour="filtres-propose"
        >
          <summary>
            <span>Filtres</span>
            {nombreFiltres > 0 && <em>{nombreFiltres}</em>}
            <Icone nom="suivant" taille={16} />
          </summary>
          <div className="puces">
            {nombreFiltres > 0 && (
              <button className="puce puce-effacer" onClick={toutEffacer}>
                <Icone nom="fermer" taille={14} /> Tout effacer
              </button>
            )}
            {TEMPS.map((t) => (
              <button
                key={t}
                className="puce"
                aria-pressed={tempsMax === t}
                onClick={() => setTempsMax(tempsMax === t ? null : t)}
              >
                ≤ {t} min
              </button>
            ))}
            <button className="puce" aria-pressed={aRefaire} onClick={() => setARefaire(!aRefaire)}>
              À refaire
            </button>
            {tousLesTags(recipes).map((t) => (
              <button
                key={t}
                className="puce"
                aria-pressed={tags.includes(t)}
                onClick={() => basculerTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </details>

        {affichees.length === 0 ? (
          <div className="vide">
            <p>Aucune recette ne correspond.</p>
            {/* Un cul-de-sac sans issue sinon : les filtres qui ont vidé
                l'écran sont repliés dans le tiroir, hors de vue. */}
            {(nombreFiltres > 0 || recherche.trim() !== '') && (
              <button className="discret suite" onClick={toutEffacer}>
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grille-recettes">
            {affichees.map((r, i) => (
              <div
                key={r.id}
                className="carte carte-recette"
                role="button"
                tabIndex={0}
                data-panier={dansPanier(r.id) ? 'true' : undefined}
                onClick={() => onDetail(r.id)}
                // La barre d'espace ouvre aussi la fiche (un vrai bouton le
                // ferait), mais seulement si le focus est sur la carte —
                // sinon elle doublerait le clic du bouton « + » imbriqué.
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onDetail(r.id)
                  }
                }}
                style={
                  {
                    '--teinte': teinteRecette(r.titre),
                    // Au-delà de la première vingtaine, plus de décalage :
                    // ces cartes sont hors écran, l'attente serait perçue
                    // comme une latence au scroll.
                    '--rang': Math.min(i, 20),
                  } as React.CSSProperties
                }
              >
                <div className="vignette" aria-hidden="true">
                  {r.image && <img src={r.image} alt="" />}
                  <span className="badge-temps">
                    <Icone nom="minuteur" taille={12} /> {r.temps} min
                  </span>
                  {!r.image && r.titre.charAt(0)}
                  <button
                    className="bouton-ajout bouton-ajout-flottant"
                    onClick={(e) => {
                      e.stopPropagation()
                      basculer(r)
                    }}
                    aria-pressed={dansPanier(r.id)}
                    aria-label={dansPanier(r.id) ? `Retirer ${r.titre} du panier` : `Ajouter ${r.titre} au panier`}
                  >
                    <Icone nom={dansPanier(r.id) ? 'coche' : 'plus'} taille={20} />
                  </button>
                </div>
                <div className="carte-recette-corps">
                  <h3>{r.titre}</h3>
                  {motifs.has(r.id) && <p className="motif-recherche">contient {motifs.get(r.id)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
