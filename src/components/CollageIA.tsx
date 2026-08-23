import { useState } from 'react'
import type { Recipe } from '../types'
import { validerCollage } from '../lib/collerRecettes'
import { genererPrompt } from '../lib/promptRecette'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Le chemin « une IA écrit la recette » : trois gestes numérotés, dits
 * dans l'ordre où on les fait. L'ancien écran affichait « 1. Le prompt
 * à copier » / « 2. La réponse de l'IA » sans jamais dire qu'entre les
 * deux il fallait ouvrir ChatGPT ou Claude, y coller le texte, et
 * revenir. C'est cette étape muette — la seule qui se passe hors de
 * l'app — qui rendait l'écran incompréhensible ; elle est maintenant
 * écrite noir sur blanc, avec les liens pour la faire.
 */
interface Props {
  onAjouter: (recette: Recipe) => Promise<void>
  /** Appelé quand le lot est passé : le nombre de recettes entrées. */
  onFini: (nombre: number) => void
  onRetour: () => void
  titresExistants: string[]
}

export default function CollageIA({ onAjouter, onFini, onRetour, titresExistants }: Props) {
  const { t } = useLangue()
  const [demande, setDemande] = useState('')
  const [texte, setTexte] = useState('')
  const [erreurs, setErreurs] = useState<string[]>([])
  const [doublons, setDoublons] = useState<string[]>([])
  const [enCours, setEnCours] = useState(false)
  const [copie, setCopie] = useState(false)
  const [ajoutees, setAjoutees] = useState(0)
  /**
   * Le presse-papier n'est pas toujours disponible : absent hors HTTPS,
   * refusé par certains navigateurs hors geste direct, et hors d'usage
   * dans une webview verrouillée. Le bouton ne faisait alors rien du
   * tout, sans un mot. Repli : on affiche le prompt en clair, prêt à
   * être sélectionné à la main.
   */
  const [promptEnClair, setPromptEnClair] = useState<string | null>(null)

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
    const { recettes, erreurs: refusees, doublons: dejaVus } = validerCollage(texte, titresExistants)
    setDoublons(dejaVus)

    if (recettes.length === 0) {
      setErreurs(refusees.length > 0 ? refusees : dejaVus.length > 0 ? [] : [t('ajouter.rienAAjouter')])
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

    setEnCours(false)
    // Ce qui a été refusé ne disparaît pas dans un passage automatique
    // à l'écran de confirmation : tant qu'il y a quelque chose à lire,
    // on reste ici.
    if (refusees.length === 0 && dejaVus.length === 0) {
      onFini(ajoutOk)
      return
    }
    setErreurs(refusees)
    setAjoutees(ajoutOk)
  }

  return (
    <div className="parcours-ia">
      <ol className="etapes-ia">
        <li>
          <h3>
            <span className="carte-champ-numero">1</span>
            {t('ajouter.iaEtape1Titre')}
          </h3>
          <p className="aide-champ">{t('ajouter.iaEtape1Texte')}</p>
          <textarea
            className="champ-texte"
            placeholder={t('ajouter.demandePlaceholder')}
            value={demande}
            onChange={(e) => setDemande(e.target.value)}
            rows={2}
            aria-label={t('ajouter.iaEtape1Titre')}
          />
          <button className="discret suite pleine-largeur" onClick={copierPrompt}>
            <Icone nom={copie ? 'coche' : 'liste'} taille={18} />{' '}
            {copie ? t('ajouter.copie') : t('ajouter.copierLePrompt')}
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
        </li>

        <li>
          <h3>
            <span className="carte-champ-numero">2</span>
            {t('ajouter.iaEtape2Titre')}
          </h3>
          <p className="aide-champ">{t('ajouter.iaEtape2Texte')}</p>
          <div className="liens-ia">
            <a className="lien-ia" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
              <Icone nom="etincelle" taille={18} /> Claude
            </a>
            <a className="lien-ia" href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">
              <Icone nom="etincelle" taille={18} /> ChatGPT
            </a>
          </div>
        </li>

        <li>
          <h3>
            <span className="carte-champ-numero">3</span>
            {t('ajouter.iaEtape3Titre')}
          </h3>
          <p className="aide-champ">{t('ajouter.iaEtape3Texte')}</p>
          <textarea
            className="champ-texte champ-texte-code"
            placeholder={t('ajouter.reponsePlaceholder')}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={8}
            aria-label={t('ajouter.iaEtape3Titre')}
          />
        </li>
      </ol>

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
          {ajoutees > 0 && (
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

      <div className="actions-formulaire">
        {/* Désactivé une fois le lot passé : recliquer rejouerait tout le
            collage et créerait des doublons. */}
        <button className="principal" onClick={valider} disabled={!texte.trim() || enCours || ajoutees > 0}>
          {enCours ? t('ajouter.ajoutEnCours') : t('ajouter.ajouterAuCatalogue')}
        </button>
        <button
          className="discret suite pleine-largeur"
          onClick={() => (ajoutees > 0 ? onFini(ajoutees) : onRetour())}
        >
          {ajoutees > 0 ? t('ajouter.terminer') : t('ajouter.retourAuChoix')}
        </button>
      </div>
    </div>
  )
}
