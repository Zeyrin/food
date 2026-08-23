import { useEffect, useMemo, useRef, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { type Historique, proposer, tousLesTags } from '../lib/propose'
import { teinteRecette } from '../lib/identite'
import { suivre } from '../lib/analytique'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'
import AjoutRecette from '../components/AjoutRecette'

interface Props {
  recipes: Recipe[]
  historique: Historique
  basket: BasketEntry[]
  onBasket: (basket: BasketEntry[]) => void
  onDetail: (recipeId: string) => void
  onAjouterRecette: (recette: Recipe) => Promise<void>
  /**
   * L'ouverture de la section d'ajout est tenue par App, pas ici :
   * changer d'onglet démonte cet écran, et le Panier a un bouton qui
   * ramène ici *pour* ajouter une recette — l'état doit survivre à ce
   * trajet, sinon on atterrit sur le catalogue sans savoir pourquoi.
   */
  ajoutOuvert: boolean
  onAjoutOuvert: (ouvert: boolean) => void
}

const TEMPS = [20, 30, 45] as const

const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

export default function Propose({
  recipes,
  historique,
  basket,
  onBasket,
  onDetail,
  onAjouterRecette,
  ajoutOuvert,
  onAjoutOuvert,
}: Props) {
  const { t } = useLangue()
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
  /**
   * L'ajout d'une recette vit ici, dans la page où l'on regarde son
   * catalogue — c'est là qu'on se rend compte qu'il manque un plat.
   * Replié, il tient en une bande ; déplié, il pousse la grille vers le
   * bas sans la masquer, pour que la recette ajoutée apparaisse juste
   * en dessous une fois la section refermée.
   */
  const ancreAjout = useRef<HTMLDivElement>(null)

  // Ouverte par un bouton d'ici ou en arrivant du Panier : dans les deux
  // cas la section doit se retrouver sous les yeux, alors qu'elle est
  // haut de page et l'écran parfois défilé ailleurs.
  useEffect(() => {
    if (!ajoutOuvert) return
    // Deux frames : la section vient à peine d'être montée.
    const image = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        ancreAjout.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      ),
    )
    return () => cancelAnimationFrame(image)
  }, [ajoutOuvert])

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

  /**
   * Ce que la recherche a donné, une fois la frappe finie — pas à
   * chaque lettre : « poulet » compterait sinon six recherches, dont
   * cinq qu'on n'a jamais voulu faire. Le terme lui-même n'est pas
   * envoyé, seulement combien de plats il a sortis : c'est le zéro
   * résultat qui dit quelque chose (un manque au catalogue), pas
   * l'inventaire de ce que le foyer a envie de manger.
   */
  useEffect(() => {
    const q = recherche.trim()
    if (!q) return
    const attente = setTimeout(() => suivre('recherche', { resultats: affichees.length }), 900)
    return () => clearTimeout(attente)
  }, [recherche, affichees.length])

  const dansPanier = (id: string) => basket.some((e) => e.recipeId === id)

  const basculer = (recette: Recipe) => {
    const dedans = dansPanier(recette.id)
    suivre(dedans ? 'panier_retrait' : 'panier_ajout', {
      titre: recette.titre,
      depuis: 'catalogue',
      portions: recette.portions,
    })
    onBasket(
      dedans
        ? basket.filter((e) => e.recipeId !== recette.id)
        : [...basket, { recipeId: recette.id, portions: recette.portions }],
    )
  }

  const ouvrirAjout = (depuis: string) => {
    suivre('ajout_ouvert', { depuis })
    onAjoutOuvert(true)
  }

  const ouvrirFiche = (recette: Recipe) => {
    suivre('recette_ouverte', { titre: recette.titre, depuis: 'catalogue' })
    onDetail(recette.id)
  }

  const basculerTag = (t: string) => {
    if (!tags.includes(t)) suivre('filtre', { filtre: 'tag', valeur: t })
    setTags((prec) => (prec.includes(t) ? prec.filter((x) => x !== t) : [...prec, t]))
  }

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
          <h1>{t('propose.titre')}</h1>
        </div>
        <div className="recherche-propose" data-tour="recherche-propose">
          <Icone nom="recherche" taille={18} />
          <input
            className="champ-texte champ-recherche"
            type="search"
            placeholder={t('propose.recherchePlaceholder')}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label={t('propose.rechercheLabel')}
          />
          {/* La croix native de `type=search` n'existe pas partout (ni sur
              Firefox, ni sur iOS) : sans elle, effacer demande d'ouvrir le
              clavier et de maintenir « retour arrière ». */}
          {recherche && (
            <button
              className="bouton-effacer-recherche"
              onClick={() => setRecherche('')}
              aria-label={t('propose.effacerRecherche')}
            >
              <Icone nom="fermer" taille={16} />
            </button>
          )}
        </div>
      </header>

      <div className="corps-propose">
        <div className="zone-ajout" ref={ancreAjout}>
          {ajoutOuvert ? (
            <AjoutRecette
              onAjouter={onAjouterRecette}
              onFerme={() => onAjoutOuvert(false)}
              titresExistants={recipes.map((r) => r.titre)}
              tagsConnus={tousLesTags(recipes)}
            />
          ) : (
            <button
              className="bande-ajout"
              onClick={() => ouvrirAjout('bande')}
              data-tour="ajout-propose"
            >
              <span className="bande-ajout-rond">
                <Icone nom="plus" taille={22} />
              </span>
              <span className="bande-ajout-texte">
                <b>{t('ajouter.sectionTitre')}</b>
                <em>{t('ajouter.sectionSousTitre')}</em>
              </span>
              <Icone nom="suivant" taille={18} />
            </button>
          )}
        </div>

        <details
          className="tiroir-filtres"
          open={filtresOuverts}
          onToggle={(e) => setFiltresOuverts(e.currentTarget.open)}
          data-tour="filtres-propose"
        >
          <summary>
            <span>{t('propose.filtres')}</span>
            {nombreFiltres > 0 && <em>{nombreFiltres}</em>}
            <Icone nom="suivant" taille={16} />
          </summary>
          <div className="puces">
            {nombreFiltres > 0 && (
              <button className="puce puce-effacer" onClick={toutEffacer}>
                <Icone nom="fermer" taille={14} /> {t('propose.toutEffacer')}
              </button>
            )}
            {TEMPS.map((mn) => (
              <button
                key={mn}
                className="puce"
                aria-pressed={tempsMax === mn}
                onClick={() => {
                  if (tempsMax !== mn) suivre('filtre', { filtre: 'temps', valeur: mn })
                  setTempsMax(tempsMax === mn ? null : mn)
                }}
              >
                {t('propose.minutesMax', { n: mn })}
              </button>
            ))}
            <button
              className="puce"
              aria-pressed={aRefaire}
              onClick={() => {
                if (!aRefaire) suivre('filtre', { filtre: 'a-refaire', valeur: 'oui' })
                setARefaire(!aRefaire)
              }}
            >
              {t('propose.aRefaire')}
            </button>
            {tousLesTags(recipes).map((tag) => (
              <button
                key={tag}
                className="puce"
                aria-pressed={tags.includes(tag)}
                onClick={() => basculerTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </details>

        {affichees.length === 0 ? (
          <div className="vide">
            <p>
              {nombreFiltres > 0 || recherche.trim() !== ''
                ? t('propose.aucuneRecette')
                : t('propose.catalogueVide')}
            </p>
            {/* Un cul-de-sac sans issue sinon : les filtres qui ont vidé
                l'écran sont repliés dans le tiroir, hors de vue. */}
            {nombreFiltres > 0 || recherche.trim() !== '' ? (
              <button className="discret suite" onClick={toutEffacer}>
                {t('propose.effacerFiltres')}
              </button>
            ) : (
              // Catalogue vide, aucun filtre en cause : la seule chose à
              // faire depuis cet écran est d'y mettre une recette.
              !ajoutOuvert && (
                <button className="principal suite" onClick={() => ouvrirAjout('catalogue-vide')}>
                  {t('ajouter.sectionTitre')}
                </button>
              )
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
                onClick={() => ouvrirFiche(r)}
                // La barre d'espace ouvre aussi la fiche (un vrai bouton le
                // ferait), mais seulement si le focus est sur la carte —
                // sinon elle doublerait le clic du bouton « + » imbriqué.
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    ouvrirFiche(r)
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
                  {r.titre.charAt(0)}
                  <ImageRecette src={r.image} />
                  <span className="badge-temps">
                    <Icone nom="minuteur" taille={12} /> {t('propose.minutes', { n: r.temps })}
                  </span>
                  <button
                    className="bouton-ajout bouton-ajout-flottant"
                    onClick={(e) => {
                      e.stopPropagation()
                      basculer(r)
                    }}
                    aria-pressed={dansPanier(r.id)}
                    aria-label={
                      dansPanier(r.id)
                        ? t('propose.retirerDuPanier', { titre: r.titre })
                        : t('propose.ajouterAuPanier', { titre: r.titre })
                    }
                  >
                    <Icone nom={dansPanier(r.id) ? 'coche' : 'plus'} taille={20} />
                  </button>
                </div>
                <div className="carte-recette-corps">
                  <h3>{r.titre}</h3>
                  {motifs.has(r.id) && (
                    <p className="motif-recherche">{t('propose.contient', { motif: motifs.get(r.id) ?? '' })}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
