import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BasketEntry, Recipe } from '../types'
import { type Historique, proposer, tousLesTags } from '../lib/propose'
import { estFavorite } from '../lib/favoris'
import { teinteRecette } from '../lib/identite'
import { useLangue } from '../lib/i18n'
import { formatMinutes } from '../lib/duree'
import { mesurer } from '../lib/mesure'
import { vibrer } from '../lib/haptique'
import { comportementDefilement } from '../lib/mouvement'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'
import VignettePlaceholder from '../components/VignettePlaceholder'
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
  /** L'adresse d'une recette partagée vers FFFood depuis une autre app. */
  lienPartage?: string | null
  /** Un avis posé en tête du catalogue, sous l'en-tête (voir `BandeauIntegre`). */
  bandeau?: React.ReactNode
  onVersPanier: () => void
}

const TEMPS = [20, 30, 45] as const

/**
 * La cascade d'entrée des cartes ne se joue qu'à la première ouverture du
 * catalogue dans la session (voir `data-entree` dans styles.css). Au
 * niveau du module : l'écran est démonté à chaque changement d'onglet.
 */
let catalogueDejaVu = false

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
  lienPartage = null,
  bandeau,
  onVersPanier,
}: Props) {
  const { t } = useLangue()
  const [recherche, setRecherche] = useState('')
  const [tempsMax, setTempsMax] = useState<number | null>(null)
  const [favorisSeuls, setFavorisSeuls] = useState(false)
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
    // Deux frames : la section vient à peine d'être montée. Les deux
    // identifiants sont retenus — n'annuler que le premier laissait la
    // seconde frame se déclencher après le démontage.
    let interne = 0
    const image = requestAnimationFrame(() => {
      interne = requestAnimationFrame(() =>
        ancreAjout.current?.scrollIntoView({
          behavior: comportementDefilement(),
          block: 'start',
        }),
      )
    })
    return () => {
      cancelAnimationFrame(image)
      cancelAnimationFrame(interne)
    }
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
    if (favorisSeuls) liste = liste.filter((r) => estFavorite(r, historique))

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
  }, [recipes, historique, tempsMax, tags, favorisSeuls, recherche])

  const basculer = (recette: Recipe) => {
    const dedans = basket.some((e) => e.recipeId === recette.id)
    // Depuis quel écran, et avec quels filtres actifs : c'est ce qui dit si
    // le tri sert à quelque chose. Jamais le titre du plat.
    mesurer(dedans ? 'plat_retire_du_panier' : 'plat_ajoute_au_panier', {
      depuis: 'proposer',
      filtres: nombreFiltres,
      recherche: recherche.trim() ? 1 : 0,
    })
    vibrer(dedans ? 'retrait' : 'leger')
    onBasket(
      dedans
        ? basket.filter((e) => e.recipeId !== recette.id)
        : [...basket, { recipeId: recette.id, portions: recette.portions }],
    )
  }

  const basculerTag = (t: string) =>
    setTags((prec) => (prec.includes(t) ? prec.filter((x) => x !== t) : [...prec, t]))

  const nombreFiltres = (tempsMax !== null ? 1 : 0) + (favorisSeuls ? 1 : 0) + tags.length

  const toutEffacer = () => {
    setTempsMax(null)
    setFavorisSeuls(false)
    setTags([])
    setRecherche('')
  }

  // Une carte de recette se contente de savoir si elle est au panier : un
  // `Set` répond sans reparcourir le panier, trois fois par carte.
  const idsPanier = useMemo(() => new Set(basket.map((e) => e.recipeId)), [basket])
  const tagsConnus = useMemo(() => tousLesTags(recipes), [recipes])

  /**
   * La dernière carte touchée, seule autorisée à jouer l'animation
   * d'ajout. Sans elle, chaque carte déjà au panier rejouait liseré,
   * rebond et onde à chaque montage de l'écran — en revenant d'une fiche
   * ou d'un autre onglet, la grille entière clignotait.
   */
  const [derniereBasculee, setDerniereBasculee] = useState<string | null>(null)

  // Les cartes sont mémoïsées : leurs rappels doivent garder la même
  // identité d'un rendu à l'autre, sinon le mémo ne sert à rien. Ils
  // passent par une référence tenue à jour à chaque rendu.
  const rappels = useRef({ basculer, onDetail })
  rappels.current = { basculer, onDetail }
  const ouvrirCarte = useCallback((id: string) => rappels.current.onDetail(id), [])
  const basculerCarte = useCallback((r: Recipe) => {
    setDerniereBasculee(r.id)
    rappels.current.basculer(r)
  }, [])

  /**
   * Une carte de recette, pour la grille comme pour les rangées. `repere`
   * marque la carte que la visite guidée fait ajouter : la première
   * affichée à l'écran, quelle que soit la section qui la porte.
   */
  const carte = (r: Recipe, i: number, cle: string, repere: boolean) => (
    <CarteRecette
      key={cle}
      recette={r}
      rang={Math.min(i, 7)}
      repere={repere}
      dansPanier={idsPanier.has(r.id)}
      favorite={estFavorite(r, historique)}
      motif={motifs.get(r.id)}
      animer={derniereBasculee === r.id}
      onOuvrir={ouvrirCarte}
      onBasculer={basculerCarte}
    />
  )

  // Les rangées thématiques ne servent qu'au catalogue brut : dès qu'une
  // recherche ou un filtre est posé, la grille répond déjà à la question.
  const rangees = useMemo(() => {
    if (nombreFiltres > 0 || recherche.trim()) return []
    const liste: { cle: string; titre: string; sousTitre?: string; recettes: Recipe[] }[] = []
    const rapides = proposer(recipes, historique, { tempsMax: 30, nombre: 10 })
    if (rapides.length >= 3) {
      liste.push({ cle: 'rapide', titre: t('propose.rangeeRapide'), sousTitre: t('propose.rangeeRapideSous'), recettes: rapides })
    }
    const aimees = proposer(recipes, historique, { nombre: recipes.length })
      .filter((r) => estFavorite(r, historique))
      .slice(0, 10)
    if (aimees.length > 0) {
      liste.push({ cle: 'favoris', titre: t('propose.rangeeFavoris'), recettes: aimees })
    }
    return liste
  }, [recipes, historique, nombreFiltres, recherche, t])

  // L'ajout d'une recette passe après la première rangée : on ouvre
  // l'écran pour choisir un plat, pas pour en écrire un — le premier écran
  // montre donc des plats. Il reste avant la grille, là où l'on s'aperçoit
  // qu'il en manque un ; et dans l'état vide, où c'est la seule suite.
  const zoneAjout = (
    <div className="zone-ajout" ref={ancreAjout}>
      {ajoutOuvert ? (
        <AjoutRecette
          onAjouter={onAjouterRecette}
          onFerme={() => onAjoutOuvert(false)}
          lienPartage={lienPartage}
          titresExistants={recipes.map((r) => r.titre)}
          tagsConnus={tagsConnus}
        />
      ) : (
        <button
          className="bande-ajout"
          onClick={() => onAjoutOuvert(true)}
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
  )

  /**
   * La barre panier monte du bas quand le premier plat est choisi, pas à
   * chaque arrivée sur l'écran : revenue d'un autre onglet avec un panier
   * déjà rempli, elle rejouait son entrée par-dessus la transition d'écran
   * et se dédoublait le temps du fondu. Elle est alors simplement là.
   */
  const entree = useRef(!catalogueDejaVu)
  useEffect(() => {
    catalogueDejaVu = true
  }, [])

  const barreVisible = basket.length > 0 && !ajoutOuvert
  const barreDejaLa = useRef(barreVisible)
  if (!barreVisible) barreDejaLa.current = false

  return (
    <div className="ecran-propose" data-entree={entree.current ? 'true' : undefined}>
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
        {bandeau}
        {/* Les filtres restent sous les yeux, en une rangée qui défile du
            pouce : repliés dans un tiroir, personne ne les ouvrait, et
            dépliés en nuage ils repoussaient la grille sous la ligne de
            flottaison. Une seule ligne règle les deux. Sur desktop, la même
            liste devient une colonne fixe à gauche de la grille. */}
        <div className="filtres" data-tour="filtres-propose">
          <p className="filtres-titre">
            {t('propose.filtres')}
            {nombreFiltres > 0 && <em>{nombreFiltres}</em>}
          </p>
          <div className="puces puces-defilantes" role="group" aria-label={t('propose.filtres')}>
            {/* En tête de rangée, avec le compte : un filtre actif peut être
                hors champ, au bout de la rangée — celle-ci dit qu'il existe
                et le retire d'un doigt. */}
            {nombreFiltres > 0 && (
              <button className="puce puce-effacer" onClick={toutEffacer}>
                <Icone nom="fermer" taille={14} /> {t('propose.toutEffacer')} <em>{nombreFiltres}</em>
              </button>
            )}
            {/* La catégorie tient dans une puce, au milieu des autres
                filtres : c'est une façon de plus de trancher dans le même
                catalogue, pas un cinquième onglet — les favoris restent des
                recettes qu'on ajoute au panier comme les autres. */}
            <button
              className="puce puce-favoris"
              aria-pressed={favorisSeuls}
              onClick={() => setFavorisSeuls(!favorisSeuls)}
            >
              <Icone nom="coeur" taille={14} /> {t('propose.favoris')}
            </button>
            {TEMPS.map((mn) => (
              <button
                key={mn}
                className="puce puce-temps"
                aria-pressed={tempsMax === mn}
                onClick={() => setTempsMax(tempsMax === mn ? null : mn)}
              >
                <Icone nom="minuteur" taille={14} /> {t('propose.minutesMax', { n: mn })}
              </button>
            ))}
            {tagsConnus.map((tag) => (
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
        </div>

        {affichees.length === 0 ? (
          <>
            {zoneAjout}
            <div className="vide">
              {/* « Aucune recette ne correspond » laisserait croire à un
                  catalogue épuisé alors que la catégorie est simplement
                  encore vide : elle se remplit toute seule, mais seulement
                  si on sait comment. */}
              <p>
                {favorisSeuls
                  ? t('propose.aucunFavori')
                  : nombreFiltres > 0 || recherche.trim() !== ''
                    ? t('propose.aucuneRecette')
                    : t('propose.catalogueVide')}
              </p>
              {/* Un cul-de-sac sans issue sinon : le filtre qui a vidé
                  l'écran est peut-être hors champ, au bout de la rangée. */}
              {nombreFiltres > 0 || recherche.trim() !== '' ? (
                <button className="discret suite" onClick={toutEffacer}>
                  {t('propose.effacerFiltres')}
                </button>
              ) : (
                // Catalogue vide, aucun filtre en cause : la seule chose à
                // faire depuis cet écran est d'y mettre une recette.
                !ajoutOuvert && (
                  <button className="principal suite" onClick={() => onAjoutOuvert(true)}>
                    {t('ajouter.sectionTitre')}
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <div className="catalogue">
            {/* Le catalogue entier d'un coup, c'est une centaine de plats :
                trop de choix ralentit le choix (loi de Hick). Avant la grille,
                deux rangées courtes font le premier tri à la place de
                l'utilisateur — ce qui se fait vite ce soir, ce qu'on a aimé —
                comme les rayons d'une appli de livraison. Elles s'effacent dès
                qu'on cherche ou qu'on filtre : on sait alors ce qu'on veut. */}
            {rangees.map((rangee, n) => (
              <section key={rangee.cle} className="section-catalogue" aria-labelledby={`rangee-${rangee.cle}`}>
                <h2 className="titre-rangee" id={`rangee-${rangee.cle}`}>
                  {rangee.titre}
                  {rangee.sousTitre && <em>{rangee.sousTitre}</em>}
                </h2>
                <div className="grille-recettes rangee-recettes">
                  {rangee.recettes.map((r, i) => carte(r, i, `${rangee.cle}-${r.id}`, n === 0 && i === 0))}
                </div>
              </section>
            ))}
            {zoneAjout}
            {rangees.length > 0 && <h2 className="titre-rangee">{t('propose.toutLeCatalogue')}</h2>}
            <div className="grille-recettes">
              {affichees.map((r, i) => carte(r, i, r.id, rangees.length === 0 && i === 0))}
            </div>
          </div>
        )}
      </div>

      {/* La suite du parcours, sous le pouce, dès le premier plat choisi —
          comme le panier des applis de livraison. La pastille de l'onglet
          compte les plats, mais ne dit pas qu'il faut y aller ensuite :
          cette barre le dit, et montre ce qu'on a déjà mis dedans. */}
      {barreVisible && (
        <>
          <div className="espaceur-action-flottante" aria-hidden="true" />
          <div className="action-flottante">
            <button
              className="barre-panier"
              data-sans-entree={barreDejaLa.current ? 'true' : undefined}
              onClick={onVersPanier}
            >
              <span className="barre-panier-plats" aria-hidden="true">
                {basket.slice(-3).map((e) => {
                  const r = recipes.find((x) => x.id === e.recipeId)
                  return (
                    <span
                      key={e.recipeId}
                      className="barre-panier-plat"
                      style={{ '--teinte': teinteRecette(r?.titre ?? '') } as React.CSSProperties}
                    >
                      {r && !r.image && <VignettePlaceholder recette={r} />}
                      <ImageRecette src={r?.image} />
                    </span>
                  )
                })}
              </span>
              <span className="barre-panier-texte">
                <b>{basket.length === 1 ? t('propose.barrePanierUn') : t('propose.barrePanier', { n: basket.length })}</b>
                <em>{t('propose.barrePanierParts', { n: basket.reduce((n, e) => n + e.portions, 0) })}</em>
              </span>
              <span className="barre-panier-action">
                {t('propose.voirPanier')}
                <Icone nom="suivant" taille={18} />
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
interface PropsCarte {
  recette: Recipe
  rang: number
  repere: boolean
  dansPanier: boolean
  favorite: boolean
  motif?: string
  /** La carte qu'on vient de toucher : la seule qui joue l'animation d'ajout. */
  animer: boolean
  onOuvrir: (id: string) => void
  onBasculer: (recette: Recipe) => void
}

/**
 * Mémoïsée : l'écran re-rend à chaque frappe dans la recherche, à chaque
 * ajout au panier, et à chaque seconde quand un minuteur tourne (l'horloge
 * vit en haut de l'app). Recomposer la centaine de cartes du catalogue à
 * chaque fois faisait ramer le défilement ; seules celles dont une prop
 * change sont maintenant re-rendues.
 */
const CarteRecette = memo(function CarteRecette({
  recette: r,
  rang,
  repere,
  dansPanier,
  favorite,
  motif,
  animer,
  onOuvrir,
  onBasculer,
}: PropsCarte) {
  const { t } = useLangue()
  return (
    <div
      className="carte carte-recette"
      role="button"
      tabIndex={0}
      data-panier={dansPanier ? 'true' : undefined}
      data-anime={animer ? 'true' : undefined}
      onClick={() => onOuvrir(r.id)}
      // La barre d'espace ouvre aussi la fiche (un vrai bouton le
      // ferait), mais seulement si le focus est sur la carte —
      // sinon elle doublerait le clic du bouton « + » imbriqué.
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOuvrir(r.id)
        }
      }}
      style={
        {
          '--teinte': teinteRecette(r.titre),
          // Le rang n'échelonne que la première hauteur d'écran :
          // au-delà, `styles.css` ne joue plus l'entrée du tout
          // (`:nth-child(-n + 8)`) — ces cartes sont hors champ,
          // et les animer coûtait une couche de composition
          // chacune pour un effet que personne ne voit.
          '--rang': rang,
        } as React.CSSProperties
      }
    >
      <div className="vignette" data-sans-photo={r.image ? undefined : 'true'} aria-hidden="true">
        {!r.image && <VignettePlaceholder recette={r} />}
        <ImageRecette src={r.image} />
        <span className="badge-temps">
          <Icone nom="minuteur" taille={12} /> {formatMinutes(r.temps, t)}
        </span>
        {favorite && (
          <span className="badge-favori" title={t('propose.favori')}>
            <Icone nom="coeur" taille={14} />
          </span>
        )}
        <button
          className="bouton-ajout bouton-ajout-flottant"
          // Le premier plat de la grille est celui que la visite
          // guidée fait ajouter (voir data/onboarding.ts).
          data-tour={repere ? 'plat-exemple' : undefined}
          onClick={(e) => {
            e.stopPropagation()
            onBasculer(r)
          }}
          aria-pressed={dansPanier}
          aria-label={
            dansPanier
              ? t('propose.retirerDuPanier', { titre: r.titre })
              : t('propose.ajouterAuPanier', { titre: r.titre })
          }
        >
          <Icone nom={dansPanier ? 'coche' : 'plus'} taille={20} />
        </button>
      </div>
      <div className="carte-recette-corps">
        <h3>{r.titre}</h3>
        {motif && <p className="motif-recherche">{t('propose.contient', { motif })}</p>}
      </div>
    </div>
  )
})
