import { useId, useState } from 'react'
import { RAYONS_ORDONNES, UNITS, type RayonId, type Recipe, type Unit } from '../types'
import { normaliserTitre } from '../lib/collerRecettes'
import { useLangue } from '../lib/i18n'
import Icone from './Icone'

/**
 * Le formulaire d'écriture d'une recette, champ par champ.
 *
 * Avant lui, la seule façon d'entrer un plat dans le catalogue était
 * de coller du JSON : parfaitement clair pour qui vient d'en demander
 * un à une IA, opaque pour qui veut juste saisir la blanquette de sa
 * grand-mère. Le JSON n'a pas disparu (voir `CollageIA`), il est
 * devenu l'autre chemin.
 *
 * Le même formulaire sert à modifier une recette existante : éditer un
 * plat, c'est remplir les mêmes cases, pas relire un objet JSON.
 */
interface Props {
  onValider: (recette: Recipe) => Promise<void>
  onAnnuler: () => void
  /** Pour refuser un titre déjà au catalogue — la sienne exclue en édition. */
  titresExistants: string[]
  /** Les tags déjà utilisés ailleurs, proposés en un clic. */
  tagsConnus: string[]
  /** En modification : la recette à rouvrir, préremplie. */
  recetteInitiale?: Recipe
  /**
   * Barre d'actions collée en bas (écran plein page). Dans la section
   * d'ajout de « Proposer », elle reste dans le flux : une barre
   * `sticky` y flotterait par-dessus le catalogue affiché en dessous.
   */
  actionsCollantes?: boolean
  /** « Annuler » sur un écran plein page, « Changer de méthode » en section. */
  libelleAnnuler?: string
}

let compteur = 0
const nouvelleCle = () => `champ-${++compteur}`

interface LigneIngredient {
  cle: string
  nom: string
  /** Chaîne et non nombre : un champ vidé au clavier n'est pas « 0 ». */
  quantite: string
  unite: Unit
  rayon: RayonId
  placard: boolean
}

interface LigneEtape {
  cle: string
  texte: string
  astuce: string
}

const ingredientVide = (): LigneIngredient => ({
  cle: nouvelleCle(),
  nom: '',
  quantite: '',
  unite: 'g',
  rayon: 'epicerie',
  placard: false,
})

const etapeVide = (): LigneEtape => ({ cle: nouvelleCle(), texte: '', astuce: '' })

/** « autre » est réservé aux articles ajoutés à la main sur la liste. */
const RAYONS_CHOISISSABLES = RAYONS_ORDONNES.filter((r) => r !== 'autre')

export default function FormulaireRecette({
  onValider,
  onAnnuler,
  titresExistants,
  tagsConnus,
  recetteInitiale,
  actionsCollantes = false,
  libelleAnnuler,
}: Props) {
  const { t } = useLangue()
  const prefixe = useId()
  const edition = recetteInitiale !== undefined

  const [titre, setTitre] = useState(recetteInitiale?.titre ?? '')
  const [temps, setTemps] = useState(recetteInitiale ? String(recetteInitiale.temps) : '')
  const [portions, setPortions] = useState(recetteInitiale ? String(recetteInitiale.portions) : '2')
  const [description, setDescription] = useState(recetteInitiale?.description ?? '')
  const [tags, setTags] = useState<string[]>(recetteInitiale?.tags ?? [])
  const [nouveauTag, setNouveauTag] = useState('')
  const [ingredients, setIngredients] = useState<LigneIngredient[]>(() =>
    recetteInitiale
      ? recetteInitiale.ingredients.map((ing) => ({
          cle: nouvelleCle(),
          nom: ing.nom,
          quantite: String(ing.quantite),
          unite: ing.unite,
          rayon: ing.rayon,
          placard: ing.placard === true,
        }))
      : [ingredientVide(), ingredientVide(), ingredientVide()],
  )
  const [etapes, setEtapes] = useState<LigneEtape[]>(() =>
    recetteInitiale
      ? recetteInitiale.etapes.map((texte, i) => ({
          cle: nouvelleCle(),
          texte,
          astuce: recetteInitiale.astuces?.[i] ?? '',
        }))
      : [etapeVide(), etapeVide()],
  )
  const [erreurs, setErreurs] = useState<string[]>([])
  const [enCours, setEnCours] = useState(false)

  const libelleUnite = (u: Unit) => {
    const traduit = t(`unites.${u}`)
    return traduit === `unites.${u}` ? u : traduit
  }
  const libelleRayon = (r: RayonId) => {
    const traduit = t(`rayons.${r}`)
    return traduit === `rayons.${r}` ? r : traduit
  }

  const majIngredient = (cle: string, champ: Partial<LigneIngredient>) =>
    setIngredients((prec) => prec.map((l) => (l.cle === cle ? { ...l, ...champ } : l)))

  const majEtape = (cle: string, champ: Partial<LigneEtape>) =>
    setEtapes((prec) => prec.map((l) => (l.cle === cle ? { ...l, ...champ } : l)))

  const basculerTag = (tag: string) =>
    setTags((prec) => (prec.includes(tag) ? prec.filter((x) => x !== tag) : [...prec, tag]))

  const ajouterTag = () => {
    const propre = nouveauTag.trim().toLowerCase()
    if (!propre) return
    setTags((prec) => (prec.includes(propre) ? prec : [...prec, propre]))
    setNouveauTag('')
  }

  // Les tags connus du catalogue, plus ceux que l'on vient d'inventer :
  // une étiquette ajoutée doit rester visible (et donc retirable) au
  // même endroit que les autres, pas dans une seconde liste à part.
  const tagsProposes = [...new Set([...tags, ...tagsConnus])]

  const soumettre = async () => {
    const titrePropre = titre.trim()
    const minutes = Number(temps)
    const parts = Number(portions)
    const lignes = ingredients.filter((l) => l.nom.trim() !== '' || l.quantite.trim() !== '')
    const pas = etapes.filter((e) => e.texte.trim() !== '')

    const trouvees: string[] = []
    if (!titrePropre) trouvees.push(t('ajouter.erreurNom'))
    else if (
      titresExistants.some(
        (existant) =>
          normaliserTitre(existant) === normaliserTitre(titrePropre) &&
          normaliserTitre(existant) !== normaliserTitre(recetteInitiale?.titre ?? ''),
      )
    ) {
      trouvees.push(t('ajouter.erreurDoublon', { titre: titrePropre }))
    }
    if (!Number.isFinite(minutes) || minutes <= 0) trouvees.push(t('ajouter.erreurTemps'))
    if (!Number.isFinite(parts) || parts < 1) trouvees.push(t('ajouter.erreurPortions'))
    if (lignes.length === 0) trouvees.push(t('ajouter.erreurIngredients'))
    lignes.forEach((l, i) => {
      const quantite = Number(l.quantite)
      if (!l.nom.trim()) trouvees.push(t('ajouter.erreurIngredientNom', { n: i + 1 }))
      else if (!Number.isFinite(quantite) || quantite <= 0) {
        trouvees.push(t('ajouter.erreurIngredientQuantite', { nom: l.nom.trim() }))
      }
    })
    if (pas.length === 0) trouvees.push(t('ajouter.erreurEtapes'))

    if (trouvees.length > 0) {
      setErreurs(trouvees)
      return
    }

    const recette: Recipe = {
      id: recetteInitiale?.id ?? crypto.randomUUID(),
      titre: titrePropre,
      temps: minutes,
      portions: parts,
      tags,
      ingredients: lignes.map((l) => ({
        nom: l.nom.trim().toLowerCase(),
        quantite: Number(l.quantite),
        unite: l.unite,
        rayon: l.rayon,
        ...(l.placard ? { placard: true } : {}),
      })),
      etapes: pas.map((e) => e.texte.trim()),
      // L'image est servie avec l'app et ne se saisit pas ici : une
      // recette rouverte pour corriger une quantité ne doit pas
      // perdre sa photo au passage.
      ...(recetteInitiale?.image ? { image: recetteInitiale.image } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      // Les astuces suivent les étapes une à une : elles sont saisies
      // sous l'étape qu'elles accompagnent, donc l'alignement tient
      // même si on en insère ou en supprime une.
      ...(pas.some((e) => e.astuce.trim()) ? { astuces: pas.map((e) => e.astuce.trim()) } : {}),
    }

    setErreurs([])
    setEnCours(true)
    try {
      await onValider(recette)
    } catch (e) {
      setErreurs([e instanceof Error ? e.message : t('ajouter.echecAjout')])
      setEnCours(false)
    }
  }

  return (
    <div className="formulaire-recette">
      <h3 className="titre-etape-formulaire">{t('ajouter.blocPlat')}</h3>

      <label className="champ-etiquette" htmlFor={`${prefixe}-titre`}>
        <span>{t('ajouter.champNom')}</span>
        <input
          id={`${prefixe}-titre`}
          className="champ-texte"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder={t('ajouter.champNomPlaceholder')}
          autoComplete="off"
        />
      </label>

      <div className="rangee-champs">
        <label className="champ-etiquette" htmlFor={`${prefixe}-temps`}>
          <span>{t('ajouter.champTemps')}</span>
          <input
            id={`${prefixe}-temps`}
            className="champ-texte"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={temps}
            onChange={(e) => setTemps(e.target.value)}
            placeholder="30"
          />
        </label>
        <label className="champ-etiquette" htmlFor={`${prefixe}-portions`}>
          <span>{t('ajouter.champPortions')}</span>
          <input
            id={`${prefixe}-portions`}
            className="champ-texte"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={portions}
            onChange={(e) => setPortions(e.target.value)}
            placeholder="4"
          />
        </label>
      </div>
      <p className="aide-champ">{t('ajouter.champPortionsAide')}</p>

      <label className="champ-etiquette" htmlFor={`${prefixe}-description`}>
        <span>{t('ajouter.champDescription')}</span>
        <input
          id={`${prefixe}-description`}
          className="champ-texte"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('ajouter.champDescriptionPlaceholder')}
        />
      </label>

      <h3 className="titre-etape-formulaire">{t('ajouter.blocTags')}</h3>
      <p className="aide-champ">{t('ajouter.tagsAide')}</p>
      {tagsProposes.length > 0 && (
        <div className="puces">
          {tagsProposes.map((tag) => (
            <button
              key={tag}
              type="button"
              className="puce"
              aria-pressed={tags.includes(tag)}
              onClick={() => basculerTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="composeur-item">
        <input
          className="champ-texte"
          value={nouveauTag}
          onChange={(e) => setNouveauTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ajouterTag()
            }
          }}
          placeholder={t('ajouter.tagNouveau')}
          aria-label={t('ajouter.tagNouveau')}
        />
        <button
          type="button"
          className="composeur-valider"
          onClick={ajouterTag}
          disabled={!nouveauTag.trim()}
          aria-label={t('ajouter.tagAjouter')}
        >
          <Icone nom="plus" taille={20} />
        </button>
      </div>

      <h3 className="titre-etape-formulaire">{t('ajouter.blocIngredients')}</h3>
      <p className="aide-champ">{t('ajouter.ingredientsAide')}</p>
      <ol className="liste-champs">
        {ingredients.map((ing, i) => (
          <li key={ing.cle} className="carte-champ">
            <div className="carte-champ-entete">
              <span className="carte-champ-numero">{i + 1}</span>
              <input
                className="champ-texte"
                value={ing.nom}
                onChange={(e) => majIngredient(ing.cle, { nom: e.target.value })}
                placeholder={t('ajouter.ingredientNomPlaceholder')}
                aria-label={t('ajouter.ingredientNom', { n: i + 1 })}
                autoComplete="off"
              />
              <button
                type="button"
                className="bouton-suppr"
                onClick={() => setIngredients((prec) => prec.filter((l) => l.cle !== ing.cle))}
                aria-label={t('ajouter.ingredientSupprimer', { n: i + 1 })}
              >
                <Icone nom="fermer" taille={16} />
              </button>
            </div>
            <div className="rangee-champs">
              <label className="champ-etiquette champ-etiquette-court">
                <span>{t('ajouter.ingredientQuantite')}</span>
                <input
                  className="champ-texte"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={ing.quantite}
                  onChange={(e) => majIngredient(ing.cle, { quantite: e.target.value })}
                  placeholder="250"
                />
              </label>
              <label className="champ-etiquette">
                <span>{t('ajouter.ingredientUnite')}</span>
                <select
                  className="champ-select"
                  value={ing.unite}
                  onChange={(e) => majIngredient(ing.cle, { unite: e.target.value as Unit })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {libelleUnite(u)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="champ-etiquette champ-etiquette-large">
                <span>{t('ajouter.ingredientRayon')}</span>
                <select
                  className="champ-select"
                  value={ing.rayon}
                  onChange={(e) => majIngredient(ing.cle, { rayon: e.target.value as RayonId })}
                >
                  {RAYONS_CHOISISSABLES.map((r) => (
                    <option key={r} value={r}>
                      {libelleRayon(r)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="case-a-cocher">
              <input
                type="checkbox"
                checked={ing.placard}
                onChange={(e) => majIngredient(ing.cle, { placard: e.target.checked })}
              />
              <span>{t('ajouter.ingredientPlacard')}</span>
            </label>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="discret pleine-largeur"
        onClick={() => setIngredients((prec) => [...prec, ingredientVide()])}
      >
        <Icone nom="plus" taille={18} /> {t('ajouter.ingredientAjouter')}
      </button>

      <h3 className="titre-etape-formulaire">{t('ajouter.blocEtapes')}</h3>
      <p className="aide-champ">{t('ajouter.etapesAide', { exemple: '{pâtes}' })}</p>
      <ol className="liste-champs">
        {etapes.map((etape, i) => (
          <li key={etape.cle} className="carte-champ">
            <div className="carte-champ-entete">
              <span className="carte-champ-numero">{i + 1}</span>
              <b className="carte-champ-titre">{t('ajouter.etapeNumero', { n: i + 1 })}</b>
              <button
                type="button"
                className="bouton-suppr"
                onClick={() => setEtapes((prec) => prec.filter((l) => l.cle !== etape.cle))}
                aria-label={t('ajouter.etapeSupprimer', { n: i + 1 })}
              >
                <Icone nom="fermer" taille={16} />
              </button>
            </div>
            <textarea
              className="champ-texte"
              rows={3}
              value={etape.texte}
              onChange={(e) => majEtape(etape.cle, { texte: e.target.value })}
              placeholder={t('ajouter.etapePlaceholder')}
              aria-label={t('ajouter.etapeNumero', { n: i + 1 })}
            />
            <input
              className="champ-texte champ-texte-secondaire"
              value={etape.astuce}
              onChange={(e) => majEtape(etape.cle, { astuce: e.target.value })}
              placeholder={t('ajouter.etapeAstuce')}
              aria-label={t('ajouter.etapeAstuceLabel', { n: i + 1 })}
            />
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="discret pleine-largeur"
        onClick={() => setEtapes((prec) => [...prec, etapeVide()])}
      >
        <Icone nom="plus" taille={18} /> {t('ajouter.etapeAjouter')}
      </button>

      {erreurs.length > 0 && (
        <div className="bloc-erreurs" role="alert">
          {erreurs.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className={actionsCollantes ? 'barre-actions' : 'actions-formulaire'}>
        <button type="button" className="principal" onClick={soumettre} disabled={enCours}>
          {enCours
            ? t('ajouter.ajoutEnCours')
            : edition
              ? t('ajouter.enregistrer')
              : t('ajouter.ajouterAuCatalogue')}
        </button>
        <button type="button" className="discret suite pleine-largeur" onClick={onAnnuler}>
          {libelleAnnuler ?? t('ajouter.annuler')}
        </button>
      </div>
    </div>
  )
}
