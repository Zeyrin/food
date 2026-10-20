import { useEffect, useRef, useState } from 'react'
import type { ItemLibre, ListItem, ListState, RayonId, Recipe } from '../types'
import { RAYONS, RAYONS_ORDONNES } from '../types'
import type { ConfigMagasins, Magasin } from '../lib/magasins'
import { grouperPourCourses } from '../lib/magasins'
import { formatQuantite } from '../lib/aggregate'
import { teinteRecette } from '../lib/identite'
import { numeroSemaine } from '../lib/semaine'
import { useLangue } from '../lib/i18n'
import { mesurer } from '../lib/mesure'
import { emojiIngredient } from '../lib/emojiIngredient'
import { vibrer } from '../lib/haptique'
import Icone from '../components/Icone'
import ImageRecette from '../components/ImageRecette'
import AssietteRecette from '../components/AssietteRecette'
import { NATIF, partagerTexte } from '../lib/natif'
import { LIEN_SIGNATURE } from '../lib/invitation'
import { partageActif } from '../lib/sync'
import { useInviter } from '../hooks/useInviter'

interface Props {
  items: ListItem[]
  etat: ListState
  onEtat: (etat: ListState) => void
  /** Les magasins du foyer et les rayons qu'on y prend (Réglages). */
  magasins: ConfigMagasins
  prochaineCuisson: Recipe | null
  onVersCuisson: () => void
  onVersReglages: () => void
  /** Liste vide : retour au catalogue, d'où elle se remplit. */
  onVersPropose: () => void
  /** La maison et le prénom d'ici : de quoi inviter quelqu'un à faire les courses. */
  foyer: string
  prenom: string
}

const itemLibreEnListItem = (item: ItemLibre): ListItem => ({
  key: `libre|${item.id}`,
  nom: item.nom,
  quantite: 1,
  unite: 'piece',
  rayon: 'autre',
  origines: [],
})

/** Une ligne tapée à la main, par opposition à une ligne de recette. */
const estLibre = (item: ListItem) => item.key.startsWith('libre|')

export default function Liste({
  items,
  etat,
  onEtat,
  magasins,
  prochaineCuisson,
  onVersCuisson,
  onVersReglages,
  onVersPropose,
  foyer,
  prenom,
}: Props) {
  const { t } = useLangue()
  const invitation = useInviter(foyer, prenom)

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

  /**
   * Partage de la liste en texte. Dans un foyer à deux, celui qui passe
   * au magasin n'est pas toujours celui qui a préparé la semaine — et
   * n'a pas forcément l'app installée. Un SMS règle le cas sans compte
   * ni installation. `null` = rien à afficher ; une chaîne = le partage
   * natif et le presse-papier ont tous deux été refusés, on montre le
   * texte à sélectionner à la main.
   */
  const [texteAPartager, setTexteAPartager] = useState<string | null>(null)
  const [copiee, setCopiee] = useState(false)

  /**
   * Une case cochée en magasin descend dans « Dans le caddie », en bas de
   * liste — ce qui reste à prendre reste groupé en haut, sans trou. Mais
   * pas tout de suite : la ligne garde sa place le temps que la coche se
   * dessine, sinon le doigt voit disparaître ce qu'il vient de toucher
   * et ne sait plus s'il a coché la bonne.
   */
  const [enSursis, setEnSursis] = useState<Set<string>>(() => new Set())
  const minuteursSursis = useRef(new Map<string, number>())
  useEffect(() => {
    const minuteurs = minuteursSursis.current
    return () => minuteurs.forEach((id) => clearTimeout(id))
  }, [])
  const garderEnPlace = (key: string) => {
    clearTimeout(minuteursSursis.current.get(key))
    setEnSursis((prec) => new Set(prec).add(key))
    minuteursSursis.current.set(
      key,
      window.setTimeout(() => {
        minuteursSursis.current.delete(key)
        setEnSursis((prec) => {
          const suivant = new Set(prec)
          suivant.delete(key)
          return suivant
        })
      }, 900),
    )
  }

  const itemsLibres = (etat.items ?? []).map(itemLibreEnListItem)
  const tousLesItems = [...items, ...itemsLibres]

  const basculer = (cle: 'coche' | 'dejaPossede', key: string) => {
    const suivant = { ...etat, [cle]: { ...etat[cle], [key]: !etat[cle][key] } }

    // Le moment où le compteur tombe à zéro : c'est la fin des courses, et
    // c'est mesuré ici plutôt que dans un effet — `restants` n'est calculé
    // qu'après un retour anticipé, un hook y serait conditionnel.
    if (cle === 'coche') {
      if (suivant.coche[key]) garderEnPlace(key)
      const aAcheterApres = [...items, ...(etat.items ?? []).map(itemLibreEnListItem)].filter(
        (i) => !suivant.dejaPossede[i.key],
      )
      const restantsApres = aAcheterApres.filter((i) => !suivant.coche[i.key]).length
      if (restantsApres === 0 && aAcheterApres.length > 0) {
        mesurer('courses_terminees', { produits: aAcheterApres.length })
        vibrer('succes')
      } else {
        vibrer(suivant.coche[key] ? 'leger' : 'retrait')
      }
    } else {
      vibrer(suivant.dejaPossede[key] ? 'leger' : 'retrait')
    }

    onEtat(suivant)
  }

  const ajouterItem = () => {
    const nom = saisie?.trim()
    if (!nom) return
    const item: ItemLibre = { id: crypto.randomUUID(), nom }
    onEtat({ ...etat, items: [...(etat.items ?? []), item] })
    setSaisie('')
  }

  const retirerItem = (id: string) =>
    onEtat({ ...etat, items: (etat.items ?? []).filter((i) => i.id !== id) })

  const labelRayon = (rayon: RayonId) => {
    const traduit = t(`rayons.${rayon}`)
    return traduit === `rayons.${rayon}` ? RAYONS[rayon].label : traduit
  }

  /** Un magasin sans nom, c'est celui par défaut : il n'en a besoin
   *  que le jour où il faut le distinguer d'un second. */
  const nomMagasin = (magasin: Magasin) => magasin.nom.trim() || t('liste.magasinSansNom')

  /** Ce qu'il reste à acheter, magasin par magasin, en texte brut. */
  const composerTexte = (restant: ListItem[]) => {
    const groupes = grouperPourCourses(restant, magasins)
    const plusieurs = groupes.length > 1
    return [
      t('liste.listeDeCourses', { n: numeroSemaine() }),
      ...groupes.flatMap(({ magasin, rayons }) => [
        ...(plusieurs ? [`— ${nomMagasin(magasin)} —`] : []),
        ...rayons.map(({ rayon, items: lignes }) =>
          [
            labelRayon(rayon),
            ...lignes.map((i) => `- ${i.nom}${estLibre(i) ? '' : ` (${formatQuantite(i)})`}`),
          ].join('\n'),
        ),
      ]),
      // Celui qui reçoit la liste par SMS n'a souvent pas l'app : une
      // ligne en bas lui dit d'où elle vient, et comment faire la sienne.
      t('liste.signature', { lien: LIEN_SIGNATURE }),
    ].join('\n\n')
  }

  const envoyer = async (restant: ListItem[]) => {
    const texte = composerTexte(restant)
    mesurer('liste_envoyee', { lignes: restant.length, partageNatif: 'share' in navigator ? 1 : 0 })
    try {
      if (NATIF) {
        await partagerTexte(t('liste.titrePartage'), texte)
        return
      }
      if (navigator.share) {
        await navigator.share({ title: t('liste.titrePartage'), text: texte })
        return
      }
      await navigator.clipboard.writeText(texte)
      setCopiee(true)
      setTimeout(() => setCopiee(false), 2000)
    } catch (e) {
      // Fermer la feuille de partage sans choisir n'est pas un échec :
      // afficher un repli à ce moment-là serait absurde.
      if ((e as Error)?.name === 'AbortError') return
      // Le plugin natif ne lève pas d'AbortError : il dit « canceled ».
      if (NATIF && /cancel/i.test((e as Error)?.message ?? '')) return
      setTexteAPartager(texte)
    }
  }

  const entete = (
    <header className="entete-app">
      <div className="entete-app-titre">
        <Icone nom="liste" />
        <h1>{t('liste.titre')}</h1>
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
        placeholder={t('liste.articlePlaceholder')}
        value={saisie}
        enterKeyHint="done"
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setSaisie(null)}
        aria-label={t('liste.articleLabel')}
      />
      <button
        type="submit"
        className="composeur-valider"
        disabled={!saisie.trim()}
        aria-label={t('liste.ajouter')}
      >
        <Icone nom="plus" taille={20} />
      </button>
      <button
        type="button"
        className="bouton-suppr"
        onClick={() => setSaisie(null)}
        aria-label={t('liste.fermerAjout')}
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
      aria-label={saisie === null ? t('liste.ajouterArticle') : t('liste.fermerAjout')}
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
          {/* Un état vide dit pourquoi il l'est et mène à la suite : la
              liste naît du panier, le bouton y conduit. */}
          <div className="vide">
            <p>{t('liste.videTexte')}</p>
            <button className="principal suite" onClick={onVersPropose}>
              {t('liste.choisirDesPlats')}
            </button>
          </div>
        </div>
        {boutonAjout}
      </>
    )
  }

  const aAcheter = tousLesItems.filter((i) => !etat.dejaPossede[i.key])
  const restants = aAcheter.filter((i) => !etat.coche[i.key]).length

  // Le parcours de courses : un arrêt après l'autre, chacun rangé par
  // rayon (voir lib/magasins.ts).
  // Ce qui est déjà dans le caddie quitte les rayons (voir `enSursis`).
  const aPrendre = aAcheter.filter((i) => !etat.coche[i.key] || enSursis.has(i.key))
  const dansLeCaddie = aAcheter.filter((i) => etat.coche[i.key] && !enSursis.has(i.key))
  const groupes = grouperPourCourses(aPrendre, magasins)
  // Sur la liste entière, pas sur ce qui reste : un magasin terminé ne
  // doit pas faire disparaître les intitulés des autres.
  const plusieursMagasins = grouperPourCourses(aAcheter, magasins).length > 1
  const TitreRayon = plusieursMagasins ? 'h3' : 'h2'

  /**
   * Deux étapes, numérotées, plutôt que deux onglets au même poids : on
   * ne choisit pas entre « chez moi » et « au magasin », on fait l'un
   * puis l'autre. Le numéro dit l'ordre, la coche dit que la première
   * est faite — c'est ce qui manquait pour comprendre à quoi sert l'écran
   * qu'on voit en premier.
   */
  const bascule = (
    <div className="etapes-liste" role="tablist">
      <button
        className="etape-liste"
        role="tab"
        aria-selected={mode === 'tri'}
        data-faite={mode === 'courses' ? 'true' : undefined}
        onClick={() => setMode('tri')}
      >
        <span className="etape-liste-numero" aria-hidden="true">
          {mode === 'courses' ? <Icone nom="coche" taille={14} /> : '1'}
        </span>
        {t('liste.modeTri')}
      </button>
      <span className="etape-liste-trait" aria-hidden="true" />
      <button
        className="etape-liste"
        role="tab"
        aria-selected={mode === 'courses'}
        onClick={() => setMode('courses')}
      >
        <span className="etape-liste-numero" aria-hidden="true">
          2
        </span>
        {t('liste.modeCourses')}
      </button>
    </div>
  )

  if (mode === 'tri') {
    const chezMoi = tousLesItems.length - aAcheter.length
    return (
      <>
        {entete}
        <div className="corps-liste corps-chez-moi">
          {bascule}

          <section className="carte-chez-moi" aria-labelledby="titre-chez-moi">
            <p className="carte-chez-moi-etape">{t('liste.etapeSur', { n: 1 })}</p>
            <h2 id="titre-chez-moi">{t('liste.triTitre')}</h2>
            <p className="carte-chez-moi-texte">{t('liste.triTexte')}</p>
            {/* Les deux tas, comptés en direct : chaque toucher fait passer
                un produit de l'un à l'autre, et on voit la liste de courses
                maigrir avant même de l'ouvrir. */}
            <div className="compteurs-chez-moi" aria-live="polite">
              <span className="compteur-chez-moi" data-tas="courses">
                <Icone nom="panier" taille={18} />
                <b>{aAcheter.length}</b> {t('liste.aAcheter')}
              </span>
              <span className="compteur-chez-moi" data-tas="maison">
                <Icone nom="coche" taille={18} />
                <b>{chezMoi}</b> {t('liste.dejaChezMoi')}
              </span>
            </div>
            {/* Le sel, l'huile, les épices ne figurent jamais ici (les
                ingrédients « placard » des recettes) : sans le dire, on
                cherche le sel dans la grille et on croit à un oubli. */}
            <p className="placard-note">
              <span aria-hidden="true">🧂</span> {t('liste.placardNote')}
            </p>
          </section>

          {/* Des tuiles plutôt que des lignes, à la façon de Bring! : un
              pictogramme se reconnaît avant qu'on lise le mot, et trois par
              rangée font tenir un rayon entier sur l'écran. Rangées par
              rayon, comme la liste magasin : les frais d'un coup devant le
              frigo, l'épicerie d'un autre devant le placard. Une tuile
              touchée passe au vert, cochée « chez moi » — elle ne
              disparaît pas, pour qu'un faux geste se rattrape aussitôt. */}
          {RAYONS_ORDONNES.map((rayon) => {
            const lignes = tousLesItems.filter((i) => i.rayon === rayon)
            if (lignes.length === 0) return null
            const faits = lignes.filter((i) => etat.dejaPossede[i.key]).length
            return (
              <section key={rayon} className="rayon-chez-moi">
                <h2 className="entete-section">
                  <span className="badge-section" data-rayon={rayon}>
                    <Icone nom={RAYONS[rayon].icone} taille={20} />
                  </span>
                  {labelRayon(rayon)}
                  <span className="entete-rayon-compte">
                    {faits}/{lignes.length}
                  </span>
                </h2>
                <div className="tuiles">
                  {lignes.map((item) => {
                    const deja = etat.dejaPossede[item.key] === true
                    return (
                      <button
                        className="tuile"
                        key={item.key}
                        data-chez-moi={deja ? 'true' : undefined}
                        // `data-chez-moi` ne pilote que le style : sans
                        // `aria-pressed`, un lecteur d'écran annonce un bouton
                        // sans jamais dire si le produit est coché.
                        aria-pressed={deja}
                        onClick={() => basculer('dejaPossede', item.key)}
                      >
                        <span className="tuile-emoji" aria-hidden="true">
                          {emojiIngredient(item.nom, item.rayon)}
                        </span>
                        <span className="tuile-nom">{item.nom}</span>
                        <span className="tuile-qte">
                          {deja ? t('liste.chezMoi') : formatQuantite(item)}
                        </span>
                        <span className="tuile-coche" aria-hidden="true">
                          <Icone nom="coche" taille={14} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <div className="espaceur-action-flottante" aria-hidden="true" />
        </div>

        {/* La suite reste sous le pouce, avec le compte à jour : on sait à
            tout moment combien de produits partiront sur la liste. */}
        <div className="action-flottante">
          <button
            className="principal"
            onClick={() => {
              // Combien la passe « chez moi » retire réellement : c'est la
              // question qui juge le concept entier.
              mesurer('tri_termine', {
                total: tousLesItems.length,
                ecartes: chezMoi,
              })
              setMode('courses')
              window.scrollTo({ top: 0 })
            }}
          >
            {t('liste.passerAuxCourses', { n: aAcheter.length })}
            <Icone nom="suivant" taille={20} />
          </button>
        </div>
      </>
    )
  }

  const ligneCourses = (item: ListItem) => {
    const coche = etat.coche[item.key] === true
    const libre = estLibre(item)
    return (
      <div className="rangee-avec-suppr" key={item.key}>
        <button
          className="rangee"
          data-coche={coche}
          aria-pressed={coche}
          onClick={() => basculer('coche', item.key)}
        >
          <span className="case">{coche && <Icone nom="coche" taille={18} />}</span>
          <span className="nom-groupe">
            <span className="nom">{item.nom}</span>
            {item.origines.length > 1 && (
              <span className="nom-partage">{t('liste.pourPlats', { liste: item.origines.join(', ') })}</span>
            )}
          </span>
          {!libre && <span className="qte">{formatQuantite(item)}</span>}
        </button>
        {libre && (
          <button
            className="bouton-suppr"
            onClick={() => retirerItem(item.key.replace('libre|', ''))}
            aria-label={t('liste.retirer', { nom: item.nom })}
          >
            <Icone nom="fermer" taille={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {entete}
      <div className="corps-liste">
        {bascule}
        {composeur}

        {/* Un seul bandeau compact au lieu de deux tuiles et d'un bouton :
            en magasin, l'écran appartient à la liste. Le compte, la jauge,
            et l'envoi par message à portée de pouce sur la même ligne. */}
        <div className="resume-courses">
          <div className="resume-courses-texte">
            <p className="carte-resume-label">{t('liste.progression')}</p>
            <p className="resume-courses-nombre">
              <b>{aAcheter.length - restants}</b> / {aAcheter.length}
            </p>
          </div>
          {restants > 0 && (
            <button
              className="resume-courses-envoyer"
              onClick={() => void envoyer(aAcheter.filter((i) => !etat.coche[i.key]))}
            >
              <Icone nom={copiee ? 'coche' : 'lien'} taille={16} />
              {copiee ? t('liste.listeCopiee') : t('liste.envoyer')}
            </button>
          )}
          {/* Le chiffre dit où on en est, la jauge dit combien il reste :
              en rayon, on la lit du coin de l'œil sans lire le nombre. */}
          <div
            className="jauge-courses"
            role="progressbar"
            aria-label={t('liste.progression')}
            aria-valuemin={0}
            aria-valuemax={aAcheter.length}
            aria-valuenow={aAcheter.length - restants}
          >
            <span
              style={{
                transform: `scaleX(${aAcheter.length ? (aAcheter.length - restants) / aAcheter.length : 1})`,
              }}
            />
          </div>
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
              <h2>{aAcheter.length === 0 ? t('liste.rienAAcheter') : t('liste.coursesTerminees')}</h2>
              <p>
                {aAcheter.length === 0
                  ? t('liste.rienAAcheterTexte')
                  : t('liste.coursesTermineesTexte', { n: aAcheter.length })}
              </p>
            </div>
            {/* La suite du parcours, ici et pas seulement tout en bas de la
                liste : quand la dernière case se coche, on est debout dans
                la file d'attente, pas en train de faire défiler l'écran. */}
            <button className="discret" onClick={onVersCuisson}>
              <Icone nom="marmite" taille={18} /> {t('liste.passerALaCuisson')}
            </button>
          </div>
        )}

        {texteAPartager !== null && (
          <>
            <p className="aide espace-haut" role="alert">
              {t('liste.partageRefuse')}
            </p>
            <textarea
              className="champ-texte champ-texte-code"
              value={texteAPartager}
              readOnly
              rows={8}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t('liste.copierAMain')}
            />
          </>
        )}

        {groupes.map(({ magasin, rayons }) => (
          <section key={magasin.id}>
            {/* L'intitulé du magasin n'apparaît qu'à partir du deuxième :
                avec un seul, il n'y a pas de choix à rappeler, et la
                liste doit commencer par le premier rayon. */}
            {plusieursMagasins && (
              <h2 className="entete-magasin">
                <Icone nom="magasin" taille={20} />
                {nomMagasin(magasin)}
              </h2>
            )}
            {rayons.map(({ rayon, items: lignes }) => (
              <div key={rayon}>
                {/* Le rayon descend d'un cran quand un magasin le
                    chapeaute : la hiérarchie annoncée au lecteur d'écran
                    doit être celle qu'on voit. */}
                <TitreRayon className="entete-section">
                  <span className="badge-section" data-rayon={rayon}>
                    <Icone nom={RAYONS[rayon].icone} taille={20} />
                  </span>
                  {labelRayon(rayon)}
                </TitreRayon>
                {lignes.map(ligneCourses)}
              </div>
            ))}
          </section>
        ))}

        {dansLeCaddie.length > 0 && (
          <details className="caddie">
            <summary>
              <span className="badge-section badge-caddie">
                <Icone nom="panier" taille={18} />
              </span>
              {t('liste.dansLeCaddie', { n: dansLeCaddie.length })}
              <Icone nom="suivant" taille={16} />
            </summary>
            {dansLeCaddie.map(ligneCourses)}
          </details>
        )}

        {/* Le découpage par magasin ne se devine pas : tant qu'il n'y en
            a qu'un, l'écran ne montre que des rayons, et rien ne dit
            qu'on peut en ajouter un deuxième. Une ligne en bas de liste,
            là où on a fini de lire, suffit à le faire savoir. */}
        {!plusieursMagasins && (
          <p className="aide espace-haut">
            {t('liste.plusieursMagasins')}{' '}
            <button className="lien-discret" onClick={onVersReglages}>
              {t('liste.reglerMagasins')}
            </button>
          </p>
        )}

        {/* Envoyer la liste règle le passage au magasin d'une semaine ;
            inviter dans la maison règle toutes les suivantes, liste cochée
            à deux en temps réel. */}
        {partageActif && (
          <p className="aide">
            {t('liste.inviterQuestion')}{' '}
            <button className="lien-discret" onClick={() => void invitation.inviter()} aria-live="polite">
              {invitation.copie ? t('liste.lienCopie') : t('liste.inviter')}
            </button>
          </p>
        )}

        {/* Ce qui attend en cuisine, en fin de liste — là où on a fini les
            courses. La tuile prenait pour fond une teinte tirée du titre : un
            magenta ou un cyan tombait à côté du vert de la tuile
            voisine, hors de la palette de l'app. Le plat a sa photo —
            elle dit mieux ce qui attend en cuisine, et la teinte reste
            le repli des recettes qui n'en ont pas. */}
        {prochaineCuisson && (
          <div
            className="carte-prochaine-cuisson"
            style={{ '--teinte': teinteRecette(prochaineCuisson.titre) } as React.CSSProperties}
          >
            {!prochaineCuisson.image && (
              <AssietteRecette titre={prochaineCuisson.titre} ingredients={prochaineCuisson.ingredients} />
            )}
            <ImageRecette src={prochaineCuisson.image} />
            <div className="carte-prochaine-cuisson-texte">
              <p className="carte-resume-label">{t('liste.prochaineCuisson')}</p>
              <p className="carte-prochaine-cuisson-titre">{prochaineCuisson.titre}</p>
            </div>
          </div>
        )}

        <div className="rangee-boutons espace-haut">
          <button className="discret" onClick={() => setMode('tri')}>
            {t('liste.revoirLeTri')}
          </button>
          <button className="discret accent" onClick={onVersCuisson}>
            <Icone nom="marmite" taille={18} /> {t('liste.cuisson')}
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
