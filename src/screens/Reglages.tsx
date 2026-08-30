import { useEffect, useState } from 'react'
import ChampCode from '../components/ChampCode'
import { LONGUEUR_CODE } from '../lib/codeFoyer'
import { useInstallation } from '../hooks/useInstallation'
import type { MiseAJour } from '../hooks/useMiseAJour'
import { reinitialiserCache, VERSION_APP } from '../lib/miseAJour'
import { useLangue } from '../lib/i18n'
import { useEtatSynchro } from '../hooks/useEtatSynchro'
import { partageActif } from '../lib/sync'
import { mesurer } from '../lib/mesure'
import type { ConfigMagasins } from '../lib/magasins'
import { magasinDuRayon } from '../lib/magasins'
import { RAYONS, RAYONS_ORDONNES, type RayonId } from '../types'
import Icone from '../components/Icone'

/**
 * Ni iOS ni Android n'exposent l'un l'API de l'autre : sur iPhone,
 * `beforeinstallprompt` n'existe pas du tout ; sur Android, Chrome
 * peut mettre un moment à l'émettre (ou pas, hors Chrome). Tant que
 * `useInstallation` répond « manuelle », il faut donc dire *où*
 * cliquer selon l'appareil plutôt que de supposer iOS pour tout le
 * monde.
 */
const estIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const estAndroid = () => /Android/.test(navigator.userAgent)

/** Découpe « texte **gras** texte » en fragments, les paires impaires en `<b>`. */
function avecGras(texte: string) {
  return texte.split('**').map((fragment, i) => (i % 2 === 1 ? <b key={i}>{fragment}</b> : fragment))
}

interface Props {
  magasins: ConfigMagasins
  onMagasins: (config: ConfigMagasins) => void
  codeFoyer: string | null
  miseAJour: MiseAJour
  onRejoindre: (code: string) => Promise<boolean>
  /** Entrée par l'UUID d'un lien de partage collé dans le champ. */
  onRejoindreLien: (foyer: string) => Promise<boolean>
  onQuitter: () => void
  onFermer: () => void
  onRevoirPresentation: () => void
}

export default function Reglages({
  magasins,
  onMagasins,
  codeFoyer,
  miseAJour,
  onRejoindre,
  onRejoindreLien,
  onQuitter,
  onFermer,
  onRevoirPresentation,
}: Props) {
  const installation = useInstallation()
  const { etat: etatSynchro, motif } = useEtatSynchro()
  const { langue, definirLangue, t } = useLangue()
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmationQuitter, setConfirmationQuitter] = useState(false)
  const [reinitialisation, setReinitialisation] = useState(false)
  const [copie, setCopie] = useState(false)
  /**
   * Ce qu'on s'apprête à rejoindre, en attente de confirmation.
   *
   * L'écran d'accueil part dès la sixième case remplie : il n'y a rien à
   * perdre, on n'est encore nulle part. Ici, la même frappe changerait la
   * maison partagée — une faute de frappe malheureuse suffirait. La saisie
   * complète ouvre donc une demande, et c'est le bouton qui l'exécute.
   */
  const [demande, setDemande] = useState<
    { type: 'code'; code: string } | { type: 'lien'; foyer: string } | null
  >(null)

  const labelRayon = (rayon: RayonId) => {
    const traduit = t(`rayons.${rayon}`)
    return traduit === `rayons.${rayon}` ? RAYONS[rayon].label : traduit
  }

  const nomAffiche = (nom: string, i: number) =>
    nom.trim() || (i === 0 ? t('reglages.magasinPrincipal') : t('reglages.magasinSansNom'))

  const renommer = (id: string, nom: string) =>
    onMagasins({ ...magasins, magasins: magasins.magasins.map((m) => (m.id === id ? { ...m, nom } : m)) })

  const ajouterMagasin = () =>
    onMagasins({
      ...magasins,
      magasins: [...magasins.magasins, { id: crypto.randomUUID(), nom: '' }],
    })

  // Le routage n'est pas nettoyé ici : `normaliserConfig` laisse tomber
  // les rayons qui pointaient vers ce magasin, et ils retournent au
  // premier. Un rayon ne peut donc pas disparaître de la liste.
  const supprimerMagasin = (id: string) =>
    onMagasins({ ...magasins, magasins: magasins.magasins.filter((m) => m.id !== id) })

  /** L'ordre des magasins est l'ordre du parcours : on doit pouvoir
   *  remonter celui par lequel on commence. */
  const monterMagasin = (i: number) => {
    const suivant = [...magasins.magasins]
    const [m] = suivant.splice(i, 1)
    suivant.splice(i - 1, 0, m!)
    onMagasins({ ...magasins, magasins: suivant })
  }

  const affecter = (rayon: RayonId, magasinId: string) =>
    onMagasins({ ...magasins, routage: { ...magasins.routage, [rayon]: magasinId } })

  // La résolution d'un code passe par le réseau : un échec (hors ligne,
  // Supabase injoignable) n'est pas un « code introuvable » et ne doit
  // pas se dire comme tel, ni laisser le bouton bloqué sur « Recherche… ».
  const rejoindre = async () => {
    if (!demande || enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      const ok =
        demande.type === 'code' ? await onRejoindre(demande.code) : await onRejoindreLien(demande.foyer)
      if (!ok) {
        setErreur(
          demande.type === 'code'
            ? t('reglages.codeErreurIntrouvable')
            : t('reglages.lienIntrouvable'),
        )
        setDemande(null)
        setEnCours(false)
      }
    } catch {
      setErreur(t('reglages.codeErreurReseau'))
      setEnCours(false)
    }
  }

  /**
   * Le code du foyer ne sert qu'à être transmis, et le lire à voix haute
   * en est le pire moyen : `2` et `Z`, `4` et `A` se confondent. Le
   * presse-papiers manque en contexte non sécurisé et sur quelques
   * WebViews — le bouton disparaît alors plutôt que d'échouer en silence.
   */
  const copiable = typeof navigator !== 'undefined' && !!navigator.clipboard

  const copier = async () => {
    if (!codeFoyer) return
    try {
      await navigator.clipboard.writeText(codeFoyer)
      setCopie(true)
    } catch {
      /* refusé par le navigateur : le code reste lisible à l'écran */
    }
  }

  // Le « Copié » retombe tout seul : laissé en place, il ferait croire à
  // un état du foyer plutôt qu'à l'écho d'un geste.
  useEffect(() => {
    if (!copie) return
    const t = setTimeout(() => setCopie(false), 2000)
    return () => clearTimeout(t)
  }, [copie])

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="menu" />
          <h1>{t('reglages.titre')}</h1>
        </div>
        <button className="bouton-rond-discret" onClick={onFermer} aria-label={t('reglages.fermer')}>
          <Icone nom="fermer" taille={20} />
        </button>
      </header>

      <h2>{t('reglages.langue')}</h2>
      <div className="rangee-boutons" role="group" aria-label={t('reglages.langue')}>
        <button
          className="discret"
          aria-pressed={langue === 'fr'}
          onClick={() => {
            mesurer('langue_changee', { vers: 'fr' })
            definirLangue('fr')
          }}
        >
          {t('reglages.langueFr')}
        </button>
        <button
          className="discret"
          aria-pressed={langue === 'en'}
          onClick={() => {
            mesurer('langue_changee', { vers: 'en' })
            definirLangue('en')
          }}
        >
          {t('reglages.langueEn')}
        </button>
      </div>

      {installation.etat !== 'installee' && (
        <>
          <h2>{t('reglages.installerTitre')}</h2>
          <p className="aide">{t('reglages.installerTexte')}</p>
          {installation.etat === 'possible' ? (
            <button className="discret suite pleine-largeur" onClick={() => void installation.installer()}>
              <Icone nom="plus-cercle" taille={18} /> {t('reglages.installerBouton')}
            </button>
          ) : estIOS() ? (
            // iOS n'expose aucune API d'installation : reste le geste, à
            // condition de savoir lequel.
            <p className="aide">
              {avecGras(
                t('reglages.installerIOS', {
                  partager: t('reglages.partager'),
                  ecranAccueil: t('reglages.ecranAccueil'),
                }),
              )}
            </p>
          ) : estAndroid() ? (
            // Chrome/Android émet `beforeinstallprompt` avec un peu de
            // retard (ou pas du tout hors Chrome) : le geste manuel reste
            // utile même sur Android.
            <p className="aide">
              {avecGras(
                t('reglages.installerAndroid', {
                  ajouterEcranAndroid: t('reglages.ajouterEcranAndroid'),
                }),
              )}
            </p>
          ) : (
            <p className="aide">{t('reglages.installerOrdinateur')}</p>
          )}
        </>
      )}

      {/* Les rayons sont les mêmes pour tout le monde, les magasins non :
          la plupart des gens font un seul magasin, certains prennent
          leurs légumes ailleurs. D'où un magasin par défaut — la liste
          n'est alors qu'une suite de rayons — et l'ajout d'un second qui
          coupe la liste en autant d'arrêts. */}
      <h2>{t('reglages.magasinsTitre')}</h2>
      <p className="aide">{t('reglages.magasinsTexte')}</p>

      {magasins.magasins.map((m, i) => (
        <div className="rangee-magasin" key={m.id}>
          <input
            className="champ-texte"
            value={m.nom}
            placeholder={i === 0 ? t('reglages.magasinPrincipal') : t('reglages.magasinSansNom')}
            onChange={(e) => renommer(m.id, e.target.value)}
            aria-label={t('reglages.nomDuMagasin', { n: i + 1 })}
          />
          {i > 0 && (
            <button
              className="bouton-suppr pivot-monter"
              onClick={() => monterMagasin(i)}
              aria-label={t('reglages.monterMagasin', { nom: nomAffiche(m.nom, i) })}
            >
              <Icone nom="precedent" taille={18} />
            </button>
          )}
          {magasins.magasins.length > 1 && (
            <button
              className="bouton-suppr"
              onClick={() => supprimerMagasin(m.id)}
              aria-label={t('reglages.supprimerMagasin', { nom: nomAffiche(m.nom, i) })}
            >
              <Icone nom="fermer" taille={16} />
            </button>
          )}
        </div>
      ))}

      <button className="discret suite pleine-largeur" onClick={ajouterMagasin}>
        <Icone nom="plus-cercle" taille={18} /> {t('reglages.ajouterMagasin')}
      </button>

      {magasins.magasins.length > 1 && (
        <>
          <h3 className="titre-secondaire">{t('reglages.routageTitre')}</h3>
          <p className="aide">{t('reglages.routageTexte')}</p>
          {RAYONS_ORDONNES.map((rayon) => (
            <div className="rangee-routage" key={rayon}>
              <span className="rangee-routage-rayon">
                <span className="badge-section" data-rayon={rayon}>
                  <Icone nom={RAYONS[rayon].icone} taille={18} />
                </span>
                {labelRayon(rayon)}
              </span>
              <select
                className="champ-select"
                value={magasinDuRayon(rayon, magasins).id}
                onChange={(e) => affecter(rayon, e.target.value)}
                aria-label={t('reglages.ouPrendreRayon', { rayon: labelRayon(rayon) })}
              >
                {magasins.magasins.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {nomAffiche(m.nom, i)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </>
      )}

      <h2>{t('reglages.decouvrirTitre')}</h2>
      <p className="aide">{t('reglages.decouvrirTexte')}</p>
      <button className="discret suite pleine-largeur" onClick={onRevoirPresentation}>
        <Icone nom="etoile" taille={18} /> {t('reglages.revoirPresentation')}
      </button>

      {/* Le foyer, d'un seul tenant : le code qu'on donne, la maison qu'on
          rejoint, celle qu'on quitte. Ces trois-là étaient dispersés de
          part et d'autre de la version de l'app — on lisait « Code à
          partager » sans voir qu'un peu plus bas se trouvait de quoi en
          changer, et la confirmation de départ parlait d'un code affiché
          deux écrans plus haut. */}
      <h2>{t('reglages.votreFoyer')}</h2>

      {codeFoyer && (
        <div className="carte-code-foyer">
          <p className="carte-resume-label">{t('reglages.codeAPartager')}</p>
          <p className="carte-code-foyer-valeur">{codeFoyer}</p>
          <p className="carte-code-foyer-aide">{t('reglages.codeAPartagerAide')}</p>
          {copiable && (
            <button
              className="discret carte-code-foyer-copier"
              onClick={() => void copier()}
              aria-live="polite"
            >
              <Icone nom={copie ? 'coche' : 'copier'} taille={18} />
              {copie ? t('reglages.codeCopie') : t('reglages.copierCode')}
            </button>
          )}
        </div>
      )}

      <h3 className="titre-secondaire">{t('reglages.rejoindreAutreFoyer')}</h3>
      <p className="aide">{t('reglages.rejoindreAutreFoyerTexte')}</p>

      {/* Dire pourquoi ça ne marchera pas, plutôt que de laisser saisir six
          caractères pour répondre « code introuvable » — même raison qu'à
          l'accueil. */}
      {!partageActif && <p className="aide">{t('reglages.partageInactif')}</p>}

      <ChampCode
        valeur={code}
        onChange={(v) => {
          setCode(v)
          setErreur(null)
          // Retoucher la saisie retire la demande qu'elle avait ouverte :
          // sinon le bouton de confirmation porterait encore l'ancien code.
          setDemande(null)
        }}
        onComplet={(c) => setDemande({ type: 'code', code: c })}
        onLien={(foyer) => setDemande({ type: 'lien', foyer })}
        onLienSansFoyer={() => setErreur(t('reglages.lienSansFoyer'))}
        desactive={!partageActif}
        invalide={erreur !== null && code.length > 0}
        label={t('reglages.codeLabel')}
        aideId="reglages-code-indice"
      />
      <p className="aide-champ" id="reglages-code-indice">
        {t('reglages.codeIndice')}
      </p>

      {erreur && (
        <div className="bloc-erreurs" role="alert">
          <p>{erreur}</p>
        </div>
      )}

      {demande ? (
        <div
          className="bloc-confirmation"
          role="alertdialog"
          aria-label={t('reglages.rejoindreAutreFoyer')}
        >
          <p>
            {demande.type === 'code'
              ? t('reglages.confirmerCode', { code: demande.code })
              : t('reglages.confirmerLien')}
          </p>
          <p>{t('reglages.confirmerGarde')}</p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setDemande(null)} disabled={enCours}>
              {t('reglages.annuler')}
            </button>
            <button className="discret accent" onClick={() => void rejoindre()} disabled={enCours}>
              {enCours ? t('reglages.recherche') : t('reglages.rejoindre')}
            </button>
          </div>
        </div>
      ) : (
        // Sans demande ouverte, le bouton n'a rien à exécuter : il sert à
        // rouvrir la confirmation qu'on vient d'annuler.
        <button
          className="discret suite pleine-largeur"
          onClick={() => {
            if (code.length === LONGUEUR_CODE) setDemande({ type: 'code', code })
          }}
          disabled={!partageActif || code.length !== LONGUEUR_CODE || enCours}
        >
          {t('reglages.rejoindre')}
        </button>
      )}

      <h3 className="titre-secondaire">{t('reglages.quitterFoyer')}</h3>
      {confirmationQuitter ? (
        <div className="bloc-confirmation" role="alertdialog" aria-label={t('reglages.quitterFoyer')}>
          <p>
            {t('reglages.quitterConfirmation', {
              code: codeFoyer ? t('reglages.quitterConfirmationCode', { code: codeFoyer }) : '',
            })}
          </p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setConfirmationQuitter(false)}>
              {t('reglages.annuler')}
            </button>
            <button className="discret danger" onClick={onQuitter}>
              {t('reglages.quitter')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="aide">{t('reglages.quitterTexte')}</p>
          <button className="discret suite pleine-largeur" onClick={() => setConfirmationQuitter(true)}>
            {t('reglages.quitterFoyerBouton')}
          </button>
        </>
      )}

      <h2>{t('reglages.versionTitre')}</h2>
      <p className="aide">{t('reglages.versionTexte')}</p>
      <p className="version-app">
        {t('reglages.versionInstallee')} : <b>{VERSION_APP}</b>
      </p>
      {miseAJour.disponible ? (
        <button className="discret suite pleine-largeur" onClick={miseAJour.appliquer}>
          <Icone nom="rafraichir" taille={18} /> {t('reglages.majInstaller')}
        </button>
      ) : (
        <button
          className="discret suite pleine-largeur"
          onClick={miseAJour.verifier}
          disabled={miseAJour.verification === 'en-cours'}
        >
          <Icone nom="rafraichir" taille={18} />
          {miseAJour.verification === 'en-cours'
            ? t('reglages.majVerification')
            : miseAJour.verification === 'a-jour'
              ? t('reglages.majAJour')
              : t('reglages.majVerifier')}
        </button>
      )}

      {/* Le cas où le cache s'entête malgré tout : jusqu'ici il fallait
          supprimer les données de l'app — ce qui emportait le foyer, le
          panier et la liste avec. Ici, seuls les fichiers en cache
          partent, les données restent. */}
      {reinitialisation ? (
        <div
          className="bloc-confirmation"
          role="alertdialog"
          aria-label={t('reglages.reinstallerLabel')}
        >
          <p>{t('reglages.reinstallerConfirmation')}</p>
          <div className="rangee-boutons">
            <button className="discret" onClick={() => setReinitialisation(false)}>
              {t('reglages.annuler')}
            </button>
            <button className="discret" onClick={() => void reinitialiserCache()}>
              {t('reglages.reinstallerBouton')}
            </button>
          </div>
        </div>
      ) : (
        <button className="lien-discret lien-maj" onClick={() => setReinitialisation(true)}>
          {t('reglages.reinstallerLien')}
        </button>
      )}

      {/* Diagnostic de synchro. C'est ici qu'atterrit la pastille « Synchro
          bloquée » : un refus du serveur ne se rattrape pas tout seul, et
          le message brut de Supabase est la seule piste exploitable pour
          savoir laquelle des trois causes habituelles s'applique. */}
      {etatSynchro === 'refuse' && (
        <>
          <h2>{t('reglages.synchroTitre')}</h2>
          <div className="bloc-erreurs" role="status">
            <p>{t('reglages.synchroTexte')}</p>
            {motif && <p><code>{motif}</code></p>}
          </div>
        </>
      )}

      {/* Les photos de plats viennent en partie de Wikimedia Commons, sous
          licences Creative Commons qui demandent de citer l'auteur : la page
          de crédits doit donc être atteignable depuis l'app, pas seulement
          depuis le dépôt. */}
      {/* La page de données est servie avec l'app, comme les crédits : une
          politique de confidentialité qui n'est atteignable que depuis le
          dépôt ne remplit pas son office. */}
      <h2>{t('reglages.donneesTitre')}</h2>
      <p className="aide">
        {t('reglages.donneesTexte')}{' '}
        <a href="/donnees.html" target="_blank" rel="noopener noreferrer">
          {t('reglages.donneesLien')}
        </a>
        .
      </p>

      <h2>{t('reglages.creditsPhoto')}</h2>
      <p className="aide">
        {t('reglages.creditsPhotoTexte')}{' '}
        <a href="/credits.html" target="_blank" rel="noopener noreferrer">
          {t('reglages.voirListe')}
        </a>
        .
      </p>
    </>
  )
}
