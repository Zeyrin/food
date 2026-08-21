import { useEffect, useState } from 'react'
import type { Recipe } from '../types'
import { validerCollage } from '../lib/collerRecettes'
import { genererPrompt } from '../lib/promptRecette'
import { useLangue } from '../lib/i18n'
import Icone from '../components/Icone'

interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  onQuitter: () => void
  /** Titres du catalogue, pour écarter un plat déjà présent. */
  titresExistants: string[]
  /** En mode édition : la recette existante, préremplie en JSON. */
  recetteInitiale?: Recipe
}

export default function AjouterRecette({
  onAjouter,
  onQuitter,
  titresExistants,
  recetteInitiale,
}: Props) {
  const { t } = useLangue()
  const [demande, setDemande] = useState('')
  const [texte, setTexte] = useState(() =>
    recetteInitiale
      ? JSON.stringify(
          {
            titre: recetteInitiale.titre,
            temps: recetteInitiale.temps,
            portions: recetteInitiale.portions,
            tags: recetteInitiale.tags,
            ingredients: recetteInitiale.ingredients,
            etapes: recetteInitiale.etapes,
            ...(recetteInitiale.image ? { image: recetteInitiale.image } : {}),
          },
          null,
          2,
        )
      : '',
  )
  const [erreurs, setErreurs] = useState<string[]>([])
  const [enCours, setEnCours] = useState(false)
  const [copie, setCopie] = useState(false)
  /** Nombre de recettes effectivement ajoutées, une fois l'envoi passé. */
  const [ajoutees, setAjoutees] = useState(0)
  /**
   * Le presse-papier n'est pas toujours disponible : absent hors HTTPS,
   * refusé par certains navigateurs hors geste direct, et hors d'usage
   * dans une webview verrouillée. Le bouton ne faisait alors rien du
   * tout, sans un mot. Repli : on affiche le prompt en clair, prêt à
   * être sélectionné à la main.
   */
  const [promptEnClair, setPromptEnClair] = useState<string | null>(null)
  const [doublons, setDoublons] = useState<string[]>([])

  const edition = recetteInitiale !== undefined

  const copierPrompt = async () => {
    const prompt = genererPrompt(demande)
    try {
      await navigator.clipboard.writeText(prompt)
      setPromptEnClair(null)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setPromptEnClair(prompt)
    }
  }

  const valider = async () => {
    setErreurs([])
    setDoublons([])
    // En modification, le titre du plat qu'on édite n'est pas un doublon
    // de lui-même.
    const dejaLa = edition
      ? titresExistants.filter((t) => t !== recetteInitiale.titre)
      : titresExistants
    const { recettes, erreurs: refusees, doublons: dejaVus } = validerCollage(texte, dejaLa)
    setDoublons(dejaVus)

    if (recettes.length === 0) {
      setErreurs(
        refusees.length > 0
          ? refusees
          : dejaVus.length > 0
            ? []
            : [t('ajouter.rienAAjouter')],
      )
      return
    }
    if (edition && recettes.length > 1) {
      setErreurs([t('ajouter.modificationSeule')])
      return
    }

    setEnCours(true)
    let ajoutOk = 0
    try {
      for (const recette of recettes) {
        await onAjouter(recette)
        ajoutOk++
      }
    } catch (e) {
      setErreurs([e instanceof Error ? e.message : t('ajouter.echecAjout')])
      setEnCours(false)
      // Une panne réseau au milieu d'un lot : ce qui est passé est
      // passé, on ne le redemande pas — le compteur le dit et le reste
      // reste collé dans le champ.
      setAjoutees(ajoutOk)
      return
    }

    // Ce qui a été refusé ne disparaît pas dans une sortie automatique :
    // l'écran reste ouvert pour dire ce qui manque (voir plus bas).
    setErreurs(refusees)
    setAjoutees(ajoutOk)
  }

  const partiel = ajoutees > 0 && (erreurs.length > 0 || doublons.length > 0)

  // Dans un `useEffect` (pas un `setTimeout` direct dans `valider`) pour
  // que le nettoyage annule l'appel si l'écran se démonte avant —
  // sinon un clic sur « Annuler » juste après l'ajout ferait reculer
  // l'historique deux fois : une fois pour Annuler, une fois pour ce
  // minuteur qui se déclenche quand même sur un `onQuitter` obsolète.
  // On ne referme pas quand une partie du lot a été refusée : il y a
  // quelque chose à lire avant de partir.
  useEffect(() => {
    if (ajoutees === 0 || partiel) return
    const t = setTimeout(onQuitter, 900)
    return () => clearTimeout(t)
  }, [ajoutees, partiel, onQuitter])

  const libelleBouton = () => {
    if (ajoutees > 0) {
      if (edition) return t('ajouter.modificationsEnregistrees')
      return ajoutees > 1 ? t('ajouter.recettesAjoutees', { n: ajoutees }) : t('ajouter.recetteAjouteeSeule')
    }
    if (enCours) return t('ajouter.ajoutEnCours')
    return edition ? t('ajouter.enregistrer') : t('ajouter.ajouterAuCatalogue')
  }

  return (
    <>
      <header className="entete-app">
        <div className="entete-app-titre">
          <Icone nom="plus-cercle" />
          <h1>{edition ? t('ajouter.titreEdition') : t('ajouter.titreAjout')}</h1>
        </div>
      </header>
      <p className="aide">{t('ajouter.intro', { exemple: '{pâtes}' })}</p>

      <h2>{t('ajouter.etape1')}</h2>
      <textarea
        className="champ-texte"
        placeholder={t('ajouter.demandePlaceholder')}
        value={demande}
        onChange={(e) => setDemande(e.target.value)}
        rows={2}
      />
      <button className="discret suite pleine-largeur" onClick={copierPrompt}>
        <Icone nom={copie ? 'coche' : 'liste'} taille={18} /> {copie ? t('ajouter.copie') : t('ajouter.copierLePrompt')}
      </button>
      {promptEnClair !== null && (
        <>
          <p className="aide espace-haut" role="alert">
            {t('ajouter.copieRefusee')}
          </p>
          <textarea
            className="champ-texte champ-texte-code"
            value={promptEnClair}
            readOnly
            rows={6}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={t('ajouter.promptAMain')}
          />
        </>
      )}

      <h2>{t('ajouter.etape2')}</h2>
      <textarea
        className="champ-texte champ-texte-code"
        placeholder={t('ajouter.reponsePlaceholder')}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={10}
      />

      {doublons.length > 0 && (
        <div className="bloc-doublons" role="status">
          <p>
            {t('ajouter.dejaAuCatalogue', {
              mot: doublons.length > 1 ? t('ajouter.laissees') : t('ajouter.laissee'),
              titres: doublons.map((d) => `« ${d} »`).join(', '),
            })}
          </p>
        </div>
      )}

      {erreurs.length > 0 && (
        <div className="bloc-erreurs" role="alert">
          {partiel && (
            <p>
              <b>{t('ajouter.recetteAjoutee', { n: ajoutees, s: ajoutees > 1 ? 's' : '' })}</b>{' '}
              {t('ajouter.resteLaisseDeCote')}
            </p>
          )}
          {erreurs.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className="barre-actions">
        {/* Désactivé une fois le lot passé : recliquer rejouerait tout le
            collage et créerait des doublons. */}
        <button className="principal" onClick={valider} disabled={!texte.trim() || enCours || ajoutees > 0}>
          {ajoutees > 0 && <Icone nom="coche" taille={20} />}
          {libelleBouton()}
        </button>
        <button className="discret suite pleine-largeur" onClick={onQuitter}>
          {partiel ? t('ajouter.terminer') : t('ajouter.annuler')}
        </button>
      </div>
    </>
  )
}
