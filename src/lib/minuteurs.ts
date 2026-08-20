/**
 * Les minuteurs de cuisson, sortis de l'écran qui les affichait.
 *
 * Ils y vivaient en état React local : quitter le mode cuisson — pour
 * vérifier un ingrédient sur la liste, répondre à un message, ou parce
 * que le système a balayé la PWA — les supprimait tous. Or on lance un
 * minuteur *précisément* pour aller faire autre chose. Ils appartiennent
 * donc à l'app, pas à l'écran, et survivent au rechargement.
 */

export interface Minuteur {
  id: string
  /** « Faire dorer les lardons » — reconnaissable quand trois tournent. */
  nom: string
  /** Sert à calculer la jauge de progression (part écoulée du total). */
  depart: number
  /**
   * Heure de fin absolue, pas un compteur qu'on décrémente : l'écran en
   * veille ou l'onglet en arrière-plan gèlent les `setInterval`, pas une
   * heure de fin.
   */
  fin: number
  /** De quel plat il vient, pour pouvoir y retourner d'un geste. */
  recipeId: string
  recetteTitre: string
}

const CLE = 'fffood:minuteurs'

/**
 * Une alarme retrouvée une demi-heure après son heure n'annonce plus
 * rien : le plat est sorti du four ou il est trop tard. On ne la fait
 * pas sonner au lancement suivant.
 */
const PEREMPTION = 30 * 60_000

export function lireMinuteurs(): Minuteur[] {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const liste = JSON.parse(brut) as Minuteur[]
    if (!Array.isArray(liste)) return []
    return liste.filter(
      (m) => typeof m?.fin === 'number' && Date.now() - m.fin < PEREMPTION,
    )
  } catch {
    return []
  }
}

export function ecrireMinuteurs(minuteurs: Minuteur[]): void {
  try {
    if (minuteurs.length === 0) localStorage.removeItem(CLE)
    else localStorage.setItem(CLE, JSON.stringify(minuteurs))
  } catch {
    /* stockage plein ou navigation privée stricte : les minuteurs ne
       survivront pas au rechargement, mais tournent normalement */
  }
}

/**
 * Bip en Web Audio plutôt qu'un fichier audio : rien à charger, et
 * surtout le contexte peut être créé/débloqué au clic sur « Lancer »
 * (geste utilisateur), pour qu'il joue plus tard sans geste quand le
 * minuteur sonne réellement — un `<audio>` déclenché hors geste se
 * ferait bloquer par l'autoplay des navigateurs.
 */
let contexteAudio: AudioContext | null = null

export function debloquerAudio(): void {
  try {
    contexteAudio ??= new (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (contexteAudio.state === 'suspended') void contexteAudio.resume()
  } catch {
    /* Web Audio indisponible : la vibration reste le seul signal */
  }
}

export function biper(): void {
  const ctx = contexteAudio
  if (!ctx) return
  try {
    const debut = ctx.currentTime
    ;[880, 1175].forEach((frequence, i) => {
      const depart = debut + i * 0.16
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequence
      gain.gain.setValueAtTime(0, depart)
      gain.gain.linearRampToValueAtTime(0.35, depart + 0.02)
      gain.gain.linearRampToValueAtTime(0, depart + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(depart)
      osc.stop(depart + 0.16)
    })
  } catch {
    /* contexte fermé ou bloqué entretemps : tant pis pour ce bip */
  }
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
