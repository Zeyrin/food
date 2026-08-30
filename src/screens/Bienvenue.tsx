import { useState } from 'react'
import ChampCode from '../components/ChampCode'
import Icone from '../components/Icone'
import { LONGUEUR_CODE } from '../lib/codeFoyer'
import { useLangue } from '../lib/i18n'
import type { FoyerPrecedent } from '../lib/local'
import { partageActif } from '../lib/sync'

interface Props {
  onCreer: () => Promise<void>
  onRejoindre: (code: string) => Promise<boolean>
  /** Entrée par l'UUID d'un lien de partage collé dans le champ. */
  onRejoindreLien: (foyer: string) => Promise<boolean>
  /** La maison qu'on a quittée sur cet appareil, s'il y en a une. */
  precedent: FoyerPrecedent | null
  onReprendre: () => Promise<boolean>
  onOublierPrecedent: () => void
}

/** Là où l'attente et l'erreur s'affichent : à côté du geste qui les a produites. */
type Zone = 'reprise' | 'creation' | 'jonction'

/**
 * Un plat du corpus livré avec l'app, plein cadre, avant même de savoir
 * ce qu'est un « foyer » : le premier écran montre plutôt qu'il ne
 * décrit. Décoratif — `alt=""` — la vraie légende de ce plat n'a rien à
 * faire ici, elle vit sur sa fiche.
 */
const PHOTO_HERO = '/plats/burger-maison.webp'

export default function Bienvenue({
  onCreer,
  onRejoindre,
  onRejoindreLien,
  precedent,
  onReprendre,
  onOublierPrecedent,
}: Props) {
  const { t } = useLangue()
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState<Zone | null>(null)
  const [erreur, setErreur] = useState<{ zone: Zone; texte: string } | null>(null)

  /**
   * Les trois entrées passent par ici : chacune est un aller-retour
   * réseau, chacune peut échouer, et sans état d'attente l'écran ne
   * bougeait pas — un second appui créait une deuxième maison, et une
   * coupure réseau ne disait rien du tout. Pas de remise à zéro après
   * succès : l'écran est démonté dans la foulée.
   *
   * Deux messages, et pas un seul : « refus » est une réponse de la base
   * — ce code n'existe pas — quand « panne » est l'absence de réponse.
   * Les confondre envoie chercher une faute de frappe dans un code
   * parfaitement valide, saisi hors réseau.
   */
  const tenter = async (
    zone: Zone,
    geste: () => Promise<boolean>,
    messages: { refus: string; panne: string },
  ) => {
    if (enCours) return
    setEnCours(zone)
    setErreur(null)
    try {
      if (!(await geste())) {
        setErreur({ zone, texte: messages.refus })
        setEnCours(null)
      }
    } catch (e) {
      // Le message réel plutôt qu'un générique, quand il y en a un : « la
      // maison n'a pas pu être créée » envoie chercher une panne de réseau
      // là où la cause est un réglage du serveur (connexions anonymes
      // désactivées). Cet écran est le seul endroit où on puisse encore le
      // lire — Réglages n'est pas atteignable tant qu'aucun foyer n'existe.
      const texte = e instanceof Error && e.message ? e.message : messages.panne
      setErreur({ zone, texte })
      setEnCours(null)
    }
  }

  const creer = () =>
    tenter(
      'creation',
      async () => {
        await onCreer()
        return true
      },
      // Créer ne se fait pas refuser : le code court est tiré côté base
      // jusqu'à en trouver un libre. Il ne reste que la panne.
      { refus: t('bienvenue.creerErreur'), panne: t('bienvenue.creerErreur') },
    )

  const reprendre = () =>
    tenter('reprise', onReprendre, {
      refus: t('bienvenue.repriseIntrouvable'),
      panne: t('bienvenue.repriseErreur'),
    })

  // Le code saisi est passé explicitement : à la sixième frappe, l'état
  // `code` n'a pas encore été rendu, et lire l'état enverrait cinq
  // caractères.
  const rejoindre = (saisi = code) => {
    if (saisi.length !== LONGUEUR_CODE) return
    return tenter('jonction', () => onRejoindre(saisi), {
      refus: t('bienvenue.codeErreurIntrouvable'),
      panne: t('bienvenue.codeErreurReseau'),
    })
  }

  const rejoindreLien = (foyer: string) =>
    tenter('jonction', () => onRejoindreLien(foyer), {
      refus: t('bienvenue.lienIntrouvable'),
      panne: t('bienvenue.codeErreurReseau'),
    })

  const messageErreur = (zone: Zone) =>
    erreur?.zone === zone && (
      <div className="bloc-erreurs" role="alert">
        <p>{erreur.texte}</p>
      </div>
    )

  return (
    <main className="accueil">
      {/* Premier écran de l'app, et le seul qui n'ait rien à montrer :
          pas de recette, pas de liste, rien à reprendre. Il présente donc
          le produit — une photo plutôt qu'une promesse écrite, la
          question du soir raturée plutôt qu'un slogan — avant de demander
          la seule décision qu'il réclame, créer ou rejoindre. */}
      <div className="accueil-hero">
        <img className="accueil-hero-photo" src={PHOTO_HERO} alt="" aria-hidden="true" />
        <div className="accueil-hero-voile" aria-hidden="true" />
        <div className="accueil-hero-corps">
          <span className="accueil-hero-sceau" aria-hidden="true">
            <Icone nom="grill" taille={22} />
          </span>
          <p className="accueil-hero-marque">FFFood</p>
          <h1 className="accueil-hero-titre">
            <span className="accueil-hero-question">{t('bienvenue.question')}</span>
            <span className="accueil-hero-reponse">{t('bienvenue.reponse')}</span>
          </h1>
          <p className="accueil-hero-baseline">{t('bienvenue.intro')}</p>
        </div>
      </div>

      <h2 className="accueil-comment-titre">{t('bienvenue.commentTitre')}</h2>
      <ol className="accueil-comment">
        <li>
          <span className="accueil-comment-pastille" aria-hidden="true">
            <Icone nom="etoile" taille={18} />
          </span>
          <div>
            <b>{t('bienvenue.etapeProposerTitre')}</b>
            <p>{t('bienvenue.etapeProposerTexte')}</p>
          </div>
        </li>
        <li>
          <span className="accueil-comment-pastille" aria-hidden="true">
            <Icone nom="liste" taille={18} />
          </span>
          <div>
            <b>{t('bienvenue.etapeListeTitre')}</b>
            <p>{t('bienvenue.etapeListeTexte')}</p>
          </div>
        </li>
        <li>
          <span className="accueil-comment-pastille" aria-hidden="true">
            <Icone nom="grill" taille={18} />
          </span>
          <div>
            <b>{t('bienvenue.etapeCuisineTitre')}</b>
            <p>{t('bienvenue.etapeCuisineTexte')}</p>
          </div>
        </li>
      </ol>

      <div className="accueil-actions">
        {/* Quitter une maison ne l'efface pas : elle reste joignable par
            son code, qu'il fallait jusqu'ici retrouver sur l'autre
            téléphone. Quand cet appareil l'a noté, le retour est un
            bouton — et l'oubli en est un autre, parce qu'on quitte aussi
            une maison pour prêter son téléphone. */}
        {precedent && (
          <section className="accueil-reprise">
            <p className="accueil-reprise-legende">{t('bienvenue.repriseTitre')}</p>
            {precedent.code ? (
              <p className="accueil-reprise-code">{precedent.code}</p>
            ) : (
              <p className="accueil-reprise-sans-code">{t('bienvenue.repriseSansCode')}</p>
            )}
            <p className="accueil-reprise-aide">{t('bienvenue.repriseAide')}</p>
            {messageErreur('reprise')}
            <button
              className="discret accent pleine-largeur"
              onClick={reprendre}
              disabled={enCours !== null}
            >
              {enCours === 'reprise' ? t('bienvenue.repriseEnCours') : t('bienvenue.repriseBouton')}
            </button>
            <button
              className="lien-discret accueil-reprise-oubli"
              onClick={onOublierPrecedent}
              disabled={enCours !== null}
            >
              {t('bienvenue.repriseOublier')}
            </button>
          </section>
        )}

        {/* Deux chemins de même rang, et non une action et son repli.
            Chacun dit ce qu'il fait avant d'être choisi : « créer » et
            « rejoindre » ne se distinguent que pour qui sait déjà comment
            l'app partage — les autres ont une chance sur deux de fonder
            une maison vide à côté de celle qu'on venait de leur ouvrir. */}
        <section className="accueil-voie">
          <h2 className="accueil-voie-titre">
            <span className="accueil-voie-pastille" aria-hidden="true">
              <Icone nom="plus" taille={16} />
            </span>
            {t('bienvenue.creerMaMaison')}
          </h2>
          <p className="accueil-voie-aide">{t('bienvenue.creerAide')}</p>
          {messageErreur('creation')}
          <button className="principal" onClick={creer} disabled={enCours !== null}>
            {enCours === 'creation' ? t('bienvenue.creation') : t('bienvenue.creerMaMaison')}
          </button>
        </section>

        <p className="accueil-ou">
          <span>{t('bienvenue.ou')}</span>
        </p>

        <section className="accueil-voie">
          <h2 className="accueil-voie-titre">
            <span className="accueil-voie-pastille" aria-hidden="true">
              <Icone nom="magasin" taille={16} />
            </span>
            {t('bienvenue.rejoindreAvecCode')}
          </h2>
          <p className="accueil-voie-aide">{t('bienvenue.rejoindreAide')}</p>

          {/* Dire pourquoi ça ne marchera pas, plutôt que de laisser saisir
              six caractères pour répondre « code introuvable ». */}
          {!partageActif && <p className="accueil-note">{t('bienvenue.partageInactif')}</p>}

          <ChampCode
            valeur={code}
            onChange={(v) => {
              setCode(v)
              // Corriger un caractère, c'est répondre à l'erreur : la
              // laisser sous un code qu'on est en train de réécrire la
              // ferait passer pour le verdict de la nouvelle saisie.
              if (erreur?.zone === 'jonction') setErreur(null)
            }}
            onComplet={(c) => void rejoindre(c)}
            onLien={(f) => void rejoindreLien(f)}
            onLienSansFoyer={() => setErreur({ zone: 'jonction', texte: t('bienvenue.lienSansFoyer') })}
            desactive={!partageActif}
            /* Rougir six cases vides accuse une saisie qui n'existe pas :
               un lien collé sans foyer dedans laisse le champ vide, et
               c'est le message qui porte l'erreur, pas les cases. */
            invalide={erreur?.zone === 'jonction' && code.length > 0}
            label={t('bienvenue.codeLabel')}
            aideId="accueil-code-indice"
          />
          <p className="accueil-indice" id="accueil-code-indice">
            {t('bienvenue.codeIndice')}
          </p>

          {messageErreur('jonction')}

          {/* Les six cases partent toutes seules une fois remplies ; le
              bouton reste pour réessayer après un échec, et pour qui
              navigue au clavier ou au lecteur d'écran. */}
          <button
            className="discret suite pleine-largeur"
            onClick={() => void rejoindre()}
            disabled={!partageActif || code.length !== LONGUEUR_CODE || enCours !== null}
          >
            {enCours === 'jonction' ? t('bienvenue.recherche') : t('bienvenue.rejoindre')}
          </button>
        </section>
      </div>
    </main>
  )
}
