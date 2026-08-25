import { useRef, useState } from 'react'
import { LONGUEUR_CODE, analyserSaisieFoyer } from '../lib/codeFoyer'

interface Props {
  valeur: string
  onChange: (code: string) => void
  /** Un lien de partage a été collé : l'UUID qu'il portait. */
  onLien: (foyer: string) => void
  /** Un lien collé, mais sans foyer dedans — à dire, pas à ignorer. */
  onLienSansFoyer: () => void
  /** Les six cases sont remplies : plus rien à attendre pour partir. */
  onComplet: (code: string) => void
  desactive?: boolean
  invalide?: boolean
  label: string
  aideId?: string
}

/**
 * Le code du foyer, en six cases.
 *
 * Un champ de texte unique demandait de compter les caractères pour
 * savoir s'il en manquait un — six cases le montrent. Elles disent aussi
 * ce qu'on attend avant qu'on ait tapé : une longueur fixe, pas un mot
 * de passe libre.
 *
 * Mais six `<input>` réels sont une mauvaise idée : il faut alors gérer
 * à la main le retour arrière entre les cases, le collage réparti sur
 * six champs, la position du curseur, et le lecteur d'écran annonce
 * « champ 3 sur 6 » pour quelque chose qui est une seule valeur. Ici il
 * n'y a donc qu'un seul champ, transparent, posé sur les cases : le
 * navigateur garde la frappe, le collage, la sélection et le clavier
 * mobile ; les cases ne sont qu'un dessin (`aria-hidden`).
 *
 * Deux conséquences à ne pas défaire :
 *  - pas de `maxLength`, sinon un lien collé serait tronqué à six
 *    caractères avant qu'on ait pu y lire l'UUID ;
 *  - `font-size: 16px` sur le champ invisible, sinon iOS zoome sur la
 *    page au moment de la mise au point.
 */
export default function ChampCode({
  valeur,
  onChange,
  onLien,
  onLienSansFoyer,
  onComplet,
  desactive = false,
  invalide = false,
  label,
  aideId,
}: Props) {
  const champ = useRef<HTMLInputElement>(null)
  const [actif, setActif] = useState(false)

  const saisir = (brut: string) => {
    const saisie = analyserSaisieFoyer(brut)

    /**
     * Le champ est contrôlé, mais React ne le réécrit que si l'état
     * change. Deux cas où il ne change pas alors que la saisie brute,
     * elle, doit disparaître : un caractère filtré (« ! » tapé après
     * « A3F » rend toujours « A3F »), et un lien collé dans un champ
     * déjà vide. Sans cette remise à niveau, le DOM garde « A3F! » ou
     * l'URL entière sous les cases — invisible, et repris tel quel à la
     * frappe suivante.
     */
    const attendu = saisie.type === 'lien' || saisie.type === 'lienSansFoyer' ? '' : saisie.code
    const el = champ.current
    if (el && el.value !== attendu) el.value = attendu

    if (saisie.type === 'lien') {
      // Le champ se vide : ce qu'on vient d'y coller n'était pas un code,
      // et laisser six caractères tirés d'un UUID ferait croire à un.
      onChange('')
      onLien(saisie.foyer)
      return
    }
    if (saisie.type === 'lienSansFoyer') {
      onChange('')
      onLienSansFoyer()
      return
    }
    onChange(saisie.code)
    if (saisie.type === 'code') onComplet(saisie.code)
  }

  /**
   * Le curseur revient en fin de valeur à la mise au point et au clic :
   * les cases dessinent une saisie qui s'ajoute à droite, et un curseur
   * posé au milieu insérerait ailleurs que là où le repère clignote.
   * Pas sur `select` ni sur l'appui long — ce serait empêcher « tout
   * sélectionner » et le menu de collage.
   */
  const versLaFin = () => {
    const el = champ.current
    if (!el) return
    el.setSelectionRange(el.value.length, el.value.length)
  }

  const cases = Array.from({ length: LONGUEUR_CODE }, (_, i) => valeur[i] ?? '')

  return (
    <div
      className="champ-code"
      data-actif={actif || undefined}
      data-invalide={invalide || undefined}
      data-desactive={desactive || undefined}
    >
      <input
        ref={champ}
        className="champ-code-saisie"
        type="text"
        value={valeur}
        onChange={(e) => saisir(e.target.value)}
        onFocus={() => {
          setActif(true)
          versLaFin()
        }}
        onBlur={() => setActif(false)}
        onClick={versLaFin}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        disabled={desactive}
        aria-label={label}
        aria-invalid={invalide || undefined}
        aria-describedby={aideId}
      />
      <div className="champ-code-cases" aria-hidden="true">
        {cases.map((c, i) => (
          <span
            key={i}
            className="champ-code-case"
            data-remplie={c ? true : undefined}
            /* Le repère ne se pose que sur la case à écrire, et seulement
               tant qu'on est dedans : sur la dernière, il resterait
               allumé une fois les six caractères saisis. */
            data-curseur={actif && i === valeur.length && !desactive ? true : undefined}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
